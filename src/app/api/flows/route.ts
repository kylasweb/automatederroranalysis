import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const where: any = {};
    if (userId) where.userId = userId;

    const flows = await db.flow.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const transformedFlows = flows.map(flow => ({
      ...flow,
      config: JSON.parse(flow.config),
      timestamp: formatTimeAgo(flow.createdAt),
      user: flow.user.name || flow.user.email
    }));

    return NextResponse.json(transformedFlows);
  } catch (error) {
    console.error('Error fetching flows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flows' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, name, description, config } = await request.json();
    
    if (!userId || !name || !config) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, name, config' },
        { status: 400 }
      );
    }

    // Create new flow
    const newFlow = await db.flow.create({
      data: {
        userId,
        name,
        description,
        config: JSON.stringify(config)
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    // Log the flow creation
    await db.auditLog.create({
      data: {
        userId,
        action: 'CREATE',
        entityType: 'Flow',
        entityId: newFlow.id,
        newValues: JSON.stringify({ name, description }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    const transformedFlow = {
      ...newFlow,
      config: JSON.parse(newFlow.config),
      timestamp: formatTimeAgo(newFlow.createdAt),
      user: newFlow.user.name || newFlow.user.email
    };

    return NextResponse.json(transformedFlow, { status: 201 });
  } catch (error) {
    console.error('Error creating flow:', error);
    return NextResponse.json(
      { error: 'Failed to create flow' },
      { status: 500 }
    );
  }
}

// Helper function
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
}