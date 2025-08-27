import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get user counts
    const totalUsers = await db.user.count();
    const activeUsers = await db.user.count({
      where: {
        analyses: {
          some: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          }
        }
      }
    });

    // Get analysis counts
    const totalAnalyses = await db.analysis.count();
    const recentAnalyses = await db.analysis.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Get alerts
    const alerts = await db.alert.findMany({
      include: {
        analysis: {
          select: {
            title: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Get system metrics (mock data for now)
    const systemMetrics = {
      cpu: Math.floor(Math.random() * 30) + 40, // 40-70%
      memory: Math.floor(Math.random() * 20) + 60, // 60-80%
      disk: Math.floor(Math.random() * 10) + 75, // 75-85%
      uptime: '15d 3h 45m' // Mock uptime
    };

    // Calculate system health (simplified)
    const systemHealth = Math.floor((100 - systemMetrics.cpu + 100 - systemMetrics.memory + 100 - systemMetrics.disk) / 3);

    // Transform data for frontend
    const transformedRecentAnalyses = recentAnalyses.map(analysis => ({
      id: analysis.id,
      title: analysis.title || `${analysis.techStack} Error Analysis`,
      user: analysis.user.name || analysis.user.email,
      status: analysis.status.toLowerCase(),
      confidence: analysis.confidence,
      timestamp: formatTimeAgo(analysis.createdAt)
    }));

    const transformedAlerts = alerts.map(alert => ({
      id: alert.id,
      type: alert.type.toLowerCase().replace('_', ' '),
      message: alert.message,
      severity: getSeverityFromType(alert.type),
      timestamp: formatTimeAgo(alert.createdAt)
    }));

    return NextResponse.json({
      totalUsers,
      totalAnalyses,
      activeUsers,
      systemHealth,
      recentAnalyses: transformedRecentAnalyses,
      alerts: transformedAlerts,
      systemMetrics
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}

// Helper functions
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

function getSeverityFromType(type: string): 'high' | 'medium' | 'low' {
  switch (type) {
    case 'SECURITY_ALERT':
      return 'high';
    case 'SYSTEM_ALERT':
      return 'high';
    case 'ANALYSIS_FAILED':
      return 'medium';
    case 'OCR_COMPLETED':
      return 'low';
    case 'ANALYSIS_COMPLETED':
      return 'low';
    default:
      return 'medium';
  }
}