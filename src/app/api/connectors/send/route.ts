import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ConnectorService } from '@/lib/connectors';

export async function POST(request: NextRequest) {
  try {
    const { connectorId, message, title } = await request.json();
    
    if (!connectorId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: connectorId, message' },
        { status: 400 }
      );
    }

    // Get the connector
    const connector = await db.connector.findUnique({
      where: { id: connectorId },
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

    if (!connector.isActive) {
      return NextResponse.json(
        { error: 'Connector is not active' },
        { status: 400 }
      );
    }

    // Send message based on connector type
    let result;
    const config = JSON.parse(connector.config);

    switch (connector.type) {
      case 'TEAMS':
        result = await ConnectorService.sendToTeams(connectorId, message, title);
        break;
      default:
        return NextResponse.json(
          { error: `Connector type ${connector.type} not supported yet` },
          { status: 400 }
        );
    }

    // Log the connector usage
    await db.auditLog.create({
      data: {
        userId: connector.userId,
        action: 'SEND',
        entityType: 'Connector',
        entityId: connector.id,
        newValues: JSON.stringify({ 
          type: connector.type, 
          title: title || 'Notification',
          messageLength: message.length 
        }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    // Update last used timestamp
    await db.connector.update({
      where: { id: connectorId },
      data: { 
        lastUsed: new Date().toISOString(),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Message sent successfully',
      connector: {
        id: connector.id,
        name: connector.name,
        type: connector.type
      }
    });

  } catch (error) {
    console.error('Error sending message via connector:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}