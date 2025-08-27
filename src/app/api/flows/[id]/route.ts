import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const flow = await db.flow.findUnique({
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

    if (!flow) {
      return NextResponse.json(
        { error: 'Flow not found' },
        { status: 404 }
      );
    }

    const transformedFlow = {
      ...flow,
      config: JSON.parse(flow.config),
      timestamp: formatTimeAgo(flow.createdAt),
      user: flow.user.name || flow.user.email
    };

    return NextResponse.json(transformedFlow);
  } catch (error) {
    console.error('Error fetching flow:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flow' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { name, description, config, isActive } = await request.json();
    
    if (!name || !config) {
      return NextResponse.json(
        { error: 'Missing required fields: name, config' },
        { status: 400 }
      );
    }

    // Get existing flow for audit log
    const existingFlow = await db.flow.findUnique({
      where: { id: params.id }
    });

    if (!existingFlow) {
      return NextResponse.json(
        { error: 'Flow not found' },
        { status: 404 }
      );
    }

    // Update flow
    const updatedFlow = await db.flow.update({
      where: { id: params.id },
      data: {
        name,
        description,
        config: JSON.stringify(config),
        isActive: isActive !== undefined ? isActive : existingFlow.isActive
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

    // Log the flow update
    await db.auditLog.create({
      data: {
        userId: updatedFlow.userId,
        action: 'UPDATE',
        entityType: 'Flow',
        entityId: updatedFlow.id,
        oldValues: JSON.stringify({
          name: existingFlow.name,
          description: existingFlow.description,
          isActive: existingFlow.isActive
        }),
        newValues: JSON.stringify({ name, description, isActive }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    const transformedFlow = {
      ...updatedFlow,
      config: JSON.parse(updatedFlow.config),
      timestamp: formatTimeAgo(updatedFlow.createdAt),
      user: updatedFlow.user.name || updatedFlow.user.email
    };

    return NextResponse.json(transformedFlow);
  } catch (error) {
    console.error('Error updating flow:', error);
    return NextResponse.json(
      { error: 'Failed to update flow' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existingFlow = await db.flow.findUnique({
      where: { id: params.id }
    });

    if (!existingFlow) {
      return NextResponse.json(
        { error: 'Flow not found' },
        { status: 404 }
      );
    }

    await db.flow.delete({
      where: { id: params.id }
    });

    // Log the flow deletion
    await db.auditLog.create({
      data: {
        userId: existingFlow.userId,
        action: 'DELETE',
        entityType: 'Flow',
        entityId: existingFlow.id,
        oldValues: JSON.stringify({
          name: existingFlow.name,
          description: existingFlow.description
        }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({ message: 'Flow deleted successfully' });
  } catch (error) {
    console.error('Error deleting flow:', error);
    return NextResponse.json(
      { error: 'Failed to delete flow' },
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