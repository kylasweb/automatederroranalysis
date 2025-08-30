import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { encryptSecret, decryptSecret } from '@/lib/crypto';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    // RBAC: only ADMIN or SUPER_ADMIN can read system settings (sensitive)
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
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

    // Group settings by category and decrypt api key values
    const groupedSettings = settings.reduce((acc, setting) => {
      const cat = setting.key.split('_')[0];
      if (!acc[cat]) {
        acc[cat] = [];
      }

      // Decrypt api_key values when returning
      let value: any;
      try {
        const parsed = JSON.parse(setting.value);
        if (setting.key.includes('api_key')) {
          // decryptSecret accepts either legacy string or EncryptedRecord-like object
          value = decryptSecret(parsed);
        } else {
          value = parsed;
        }
      } catch {
        value = setting.value;
      }

      acc[cat].push({
        key: setting.key,
        value,
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

export async function PUT(request: Request) {
  try {
    // RBAC: only ADMIN or SUPER_ADMIN can update system settings
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
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
    // Encrypt api keys before saving
    let valueToStore: any = value;
    if (key.includes('api_key') && typeof value === 'string' && value.length > 0) {
      // encryptSecret returns an EncryptedRecord object
      valueToStore = encryptSecret(value);
    }

    if (existingSetting) {
      // Update existing setting
      updatedSetting = await db.systemSetting.update({
        where: { key },
        data: {
          value: JSON.stringify(valueToStore)
        }
      });
    } else {
      // Create new setting
      updatedSetting = await db.systemSetting.create({
        data: {
          key,
          value: JSON.stringify(valueToStore)
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

    // Decrypt if api_key
    let returnedValue: any;
    try {
      const parsed = JSON.parse(updatedSetting.value);
      if (updatedSetting.key.includes('api_key')) {
        returnedValue = decryptSecret(parsed);
      } else {
        returnedValue = parsed;
      }
    } catch {
      returnedValue = updatedSetting.value;
    }

    return NextResponse.json({
      key: updatedSetting.key,
      value: returnedValue,
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