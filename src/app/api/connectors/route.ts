import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const where: any = {};
    if (userId) where.userId = userId;

    const connectors = await db.connector.findMany({
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

    const transformedConnectors = connectors.map(connector => ({
      ...connector,
      config: JSON.parse(connector.config),
      timestamp: formatTimeAgo(connector.createdAt),
      user: connector.user.name || connector.user.email
    }));

    return NextResponse.json(transformedConnectors);
  } catch (error) {
    console.error('Error fetching connectors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connectors' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, name, type, config } = await request.json();
    
    if (!userId || !name || !type || !config) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, name, type, config' },
        { status: 400 }
      );
    }

    // Create new connector
    const newConnector = await db.connector.create({
      data: {
        userId,
        name,
        type,
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

    // Log the connector creation
    await db.auditLog.create({
      data: {
        userId,
        action: 'CREATE',
        entityType: 'Connector',
        entityId: newConnector.id,
        newValues: JSON.stringify({ name, type }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    const transformedConnector = {
      ...newConnector,
      config: JSON.parse(newConnector.config),
      timestamp: formatTimeAgo(newConnector.createdAt),
      user: newConnector.user.name || newConnector.user.email
    };

    return NextResponse.json(transformedConnector, { status: 201 });
  } catch (error) {
    console.error('Error creating connector:', error);
    return NextResponse.json(
      { error: 'Failed to create connector' },
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