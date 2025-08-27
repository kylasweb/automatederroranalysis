import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ConnectorService } from '@/lib/connectors';

export async function POST(request: NextRequest) {
  try {
    const {
      analysisId,
      notificationType, // 'intermittent' or 'bug'
      connectorId,
      customMessage
    } = await request.json();

    if (!analysisId || !notificationType || !connectorId) {
      return NextResponse.json(
        { error: 'Missing required fields: analysisId, notificationType, connectorId' },
        { status: 400 }
      );
    }

    if (!['intermittent', 'bug'].includes(notificationType)) {
      return NextResponse.json(
        { error: 'Invalid notificationType. Must be "intermittent" or "bug"' },
        { status: 400 }
      );
    }

    // Get the analysis details
    const analysis = await db.analysis.findUnique({
      where: { id: analysisId },
      include: {
        user: {
          select: {
            name: true,
            email: true
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

    // Get the connector
    const connector = await db.connector.findUnique({
      where: { id: connectorId }
    });

    if (!connector) {
      return NextResponse.json(
        { error: 'Connector not found' },
        { status: 404 }
      );
    }

    if (!connector.isActive) {
      return NextResponse.json(
        { error: 'Connector is not active' },
        { status: 400 }
      );
    }

    // Generate notification message based on type
    let title, message;
    const config = JSON.parse(connector.config);
    const channel = config.channel || 'General';

    if (notificationType === 'intermittent') {
      title = '🔄 Intermittent Issue Detected - Cluster Re-provisioning Recommended';
      message = customMessage || `
**Intermittent Issue Analysis Complete** 🔄

**Analysis Details:**
- **Tech Stack:** ${analysis.techStack}
- **Environment:** ${analysis.environment}
- **Confidence:** ${Math.round(analysis.confidence * 100)}%
- **Analyzed by:** ${analysis.source}

**Issue Type:** Intermittent
**Recommendation:** This appears to be an intermittent issue that can be resolved by re-provisioning the cluster.

**Action Required:** 
👉 **Testers:** Please re-provision the cluster and verify if the issue resolves.
👉 **Team:** Monitor the cluster after re-provisioning to ensure stability.

**Analysis Summary:**
${analysis.analysis.substring(0, 500)}${analysis.analysis.length > 500 ? '...' : ''}

---
*Sent by LogAllot Provision Error Log Analysis System*
      `;
    } else {
      title = '🐛 Bug Detected - Code Fix Required';
      message = customMessage || `
**Bug Analysis Complete** 🐛

**Analysis Details:**
- **Tech Stack:** ${analysis.techStack}
- **Environment:** ${analysis.environment}
- **Confidence:** ${Math.round(analysis.confidence * 100)}%
- **Analyzed by:** ${analysis.source}

**Issue Type:** Bug - Code Fix Required
**Recommendation:** This issue requires a code fix to resolve permanently.

**Action Required:**
👉 **Developers:** Please review the analysis and implement the necessary code fix.
👉 **Testers:** Once the fix is implemented, please test thoroughly to ensure the issue is resolved.

**Bug Details:**
${analysis.analysis.substring(0, 500)}${analysis.analysis.length > 500 ? '...' : ''}

---
*Sent by LogAllot Provision Error Log Analysis System*
      `;
    }

    // Send message to Teams
    const result = await ConnectorService.sendToTeams(connectorId, message, title);

    // Log the notification
    await db.auditLog.create({
      data: {
        userId: analysis.userId,
        action: 'SEND_TEAMS_NOTIFICATION',
        entityType: 'Analysis',
        entityId: analysisId,
        newValues: JSON.stringify({
          notificationType,
          connectorId,
          channel,
          title,
          messageLength: message.length
        }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    // Update connector last used timestamp
    await db.connector.update({
      where: { id: connectorId },
      data: {
        lastUsed: new Date().toISOString(),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully',
      notificationType,
      connector: {
        id: connector.id,
        name: connector.name,
        type: connector.type,
        channel
      }
    });

  } catch (error) {
    console.error('Error sending Teams notification:', error);
    return NextResponse.json(
      { error: 'Failed to send Teams notification' },
      { status: 500 }
    );
  }
}