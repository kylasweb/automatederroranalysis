import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const where: any = {};
    if (category) {
      where.key = {
        startsWith: category + '_'
      };
    }

    const settings = await db.systemSetting.findMany({
      where,
      orderBy: { key: 'asc' }
    });

    // Group settings by category
    const groupedSettings = settings.reduce((acc, setting) => {
      const category = setting.key.split('_')[0];
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push({
        key: setting.key,
        value: JSON.parse(setting.value),
        createdAt: setting.createdAt,
        updatedAt: setting.updatedAt
      });
      return acc;
    }, {} as Record<string, any[]>);

    return NextResponse.json(groupedSettings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { key, value } = await request.json();
    
    if (!key || value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: key, value' },
        { status: 400 }
      );
    }

    // Check if setting exists
    const existingSetting = await db.systemSetting.findUnique({
      where: { key }
    });

    let updatedSetting;
    if (existingSetting) {
      // Update existing setting
      updatedSetting = await db.systemSetting.update({
        where: { key },
        data: {
          value: JSON.stringify(value)
        }
      });
    } else {
      // Create new setting
      updatedSetting = await db.systemSetting.create({
        data: {
          key,
          value: JSON.stringify(value)
        }
      });
    }

    // Log the setting update
    await db.auditLog.create({
      data: {
        action: existingSetting ? 'UPDATE' : 'CREATE',
        entityType: 'SystemSetting',
        entityId: updatedSetting.id,
        oldValues: existingSetting ? JSON.stringify({ key, value: JSON.parse(existingSetting.value) }) : null,
        newValues: JSON.stringify({ key, value }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      key: updatedSetting.key,
      value: JSON.parse(updatedSetting.value),
      createdAt: updatedSetting.createdAt,
      updatedAt: updatedSetting.updatedAt
    });
  } catch (error) {
    console.error('Error updating setting:', error);
    return NextResponse.json(
      { error: 'Failed to update setting' },
      { status: 500 }
    );
  }
}