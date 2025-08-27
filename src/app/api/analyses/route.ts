import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    const skip = (page - 1) * limit;

    const where: any = {};
    if (userId) where.userId = userId;
    if (status) where.status = status.toUpperCase();

    const [analyses, total] = await Promise.all([
      db.analysis.findMany({
        where,
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
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      db.analysis.count({ where })
    ]);

    const transformedAnalyses = analyses.map(analysis => ({
      ...analysis,
      timestamp: formatTimeAgo(analysis.createdAt),
      user: analysis.user.name || analysis.user.email
    }));

    return NextResponse.json({
      analyses: transformedAnalyses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching analyses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analyses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, title, logContent, techStack, environment, analysis, confidence, source, ocrExtracted } = await request.json();
    
    if (!userId || !logContent || !analysis) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, logContent, analysis' },
        { status: 400 }
      );
    }

    // Create new analysis
    const newAnalysis = await db.analysis.create({
      data: {
        userId,
        title,
        logContent,
        techStack: techStack || 'Unknown',
        environment: environment || 'Unknown',
        analysis,
        confidence: confidence || 0,
        source: source || 'System',
        status: 'COMPLETED',
        ocrExtracted
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

    // Create analysis completed alert
    await db.alert.create({
      data: {
        analysisId: newAnalysis.id,
        type: 'ANALYSIS_COMPLETED',
        message: `Analysis completed successfully with ${Math.round(confidence * 100)}% confidence`,
        status: 'PENDING'
      }
    });

    // Log the analysis creation
    await db.auditLog.create({
      data: {
        userId,
        action: 'CREATE',
        entityType: 'Analysis',
        entityId: newAnalysis.id,
        newValues: JSON.stringify({ title, techStack, environment, confidence }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    const transformedAnalysis = {
      ...newAnalysis,
      timestamp: formatTimeAgo(newAnalysis.createdAt),
      user: newAnalysis.user.name || newAnalysis.user.email
    };

    return NextResponse.json(transformedAnalysis, { status: 201 });
  } catch (error) {
    console.error('Error creating analysis:', error);
    return NextResponse.json(
      { error: 'Failed to create analysis' },
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