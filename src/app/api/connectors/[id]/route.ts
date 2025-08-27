import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const connector = await db.connector.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!connector) {
      return NextResponse.json(
        { error: 'Connector not found' },
        { status: 404 }
      );
    }

    const transformedConnector = {
      ...connector,
      config: JSON.parse(connector.config),
      timestamp: formatTimeAgo(connector.createdAt),
      user: connector.user.name || connector.user.email
    };

    return NextResponse.json(transformedConnector);
  } catch (error) {
    console.error('Error fetching connector:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connector' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { name, type, config, isActive } = await request.json();
    
    // Find the connector first
    const existingConnector = await db.connector.findUnique({
      where: { id: params.id }
    });

    if (!existingConnector) {
      return NextResponse.json(
        { error: 'Connector not found' },
        { status: 404 }
      );
    }

    // Update connector
    const updatedConnector = await db.connector.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(config !== undefined && { config: JSON.stringify(config) }),
        ...(isActive !== undefined && { isActive })
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

    const transformedConnector = {
      ...updatedConnector,
      config: JSON.parse(updatedConnector.config),
      timestamp: formatTimeAgo(updatedConnector.createdAt),
      user: updatedConnector.user.name || updatedConnector.user.email
    };

    return NextResponse.json(transformedConnector);
  } catch (error) {
    console.error('Error updating connector:', error);
    return NextResponse.json(
      { error: 'Failed to update connector' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const connector = await db.connector.findUnique({
      where: { id: params.id }
    });

    if (!connector) {
      return NextResponse.json(
        { error: 'Connector not found' },
        { status: 404 }
      );
    }

    // Delete connector
    await db.connector.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Connector deleted successfully' });
  } catch (error) {
    console.error('Error deleting connector:', error);
    return NextResponse.json(
      { error: 'Failed to delete connector' },
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