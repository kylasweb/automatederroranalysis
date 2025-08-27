import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { analyzeLogWithAI } from '@/lib/ai-analysis';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { logContent, userId } = await request.json();
    
    if (!logContent || typeof logContent !== 'string') {
      return NextResponse.json(
        { error: 'Invalid log content provided' },
        { status: 400 }
      );
    }

    // Generate a unique ID for this analysis
    const analysisId = uuidv4();
    
    // Perform AI analysis
    const analysisResult = await analyzeLogWithAI(logContent, analysisId);
    
    // Save to database (if userId provided)
    if (userId) {
      try {
        await db.analysis.create({
          data: {
            id: analysisId,
            userId,
            logContent,
            techStack: analysisResult.techStack,
            environment: analysisResult.environment,
            analysis: analysisResult.analysis,
            confidence: analysisResult.confidence,
            source: analysisResult.source,
            isIntermittent: analysisResult.isIntermittent || false,
            needsFix: analysisResult.needsFix || true,
            status: 'COMPLETED'
          }
        });

        // Create analysis completed alert
        await db.alert.create({
          data: {
            analysisId,
            type: 'ANALYSIS_COMPLETED',
            message: `Analysis completed successfully with ${Math.round(analysisResult.confidence * 100)}% confidence`,
            status: 'PENDING'
          }
        });

        // Log the analysis creation
        await db.auditLog.create({
          data: {
            userId,
            action: 'CREATE',
            entityType: 'Analysis',
            entityId: analysisId,
            newValues: JSON.stringify({ 
              techStack: analysisResult.techStack, 
              environment: analysisResult.environment, 
              confidence: analysisResult.confidence 
            }),
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown'
          }
        });
      } catch (dbError) {
        console.error('Database save failed:', dbError);
        // Return analysis result even if database save fails
        return NextResponse.json({
          ...analysisResult,
          warning: 'Analysis completed but could not be saved to database'
        });
      }
    } else {
      // For anonymous users, just return the analysis without saving
      console.log('Anonymous analysis - not saving to database');
    }
    
    return NextResponse.json(analysisResult);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze log' },
      { status: 500 }
    );
  }
}