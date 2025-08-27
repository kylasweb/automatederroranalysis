import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const analysis = await db.analysis.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        alerts: {
          select: {
            id: true,
            type: true,
            status: true,
            createdAt: true
          }
        }
      }
    });

    if (!analysis) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      );
    }

    const transformedAnalysis = {
      ...analysis,
      timestamp: formatTimeAgo(analysis.createdAt),
      user: analysis.user.name || analysis.user.email
    };

    return NextResponse.json(transformedAnalysis);
  } catch (error) {
    console.error('Error fetching analysis:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analysis' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const analysis = await db.analysis.findUnique({
      where: { id: params.id }
    });

    if (!analysis) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      );
    }

    // Delete analysis (cascade will handle related alerts)
    await db.analysis.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Analysis deleted successfully' });
  } catch (error) {
    console.error('Error deleting analysis:', error);
    return NextResponse.json(
      { error: 'Failed to delete analysis' },
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