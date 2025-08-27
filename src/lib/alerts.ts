import { db } from '@/lib/db';
import { AlertType, AlertStatus } from '@prisma/client';
import { Server } from 'socket.io';

export interface AlertPayload {
  type: AlertType;
  message: string;
  userId?: string;
  analysisId?: string;
  data?: any;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export class RealTimeAlertManager {
  private io: Server;
  private userSockets: Map<string, string[]> = new Map(); // userId -> socketId[]

  constructor(io: Server) {
    this.io = io;
    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('User connected to alerts:', socket.id);

      // User authentication and socket registration
      socket.on('register_user', (userId: string) => {
        this.registerUserSocket(userId, socket.id);
        socket.emit('user_registered', { userId, socketId: socket.id });
      });

      // User disconnect
      socket.on('disconnect', () => {
        this.unregisterSocket(socket.id);
        console.log('User disconnected from alerts:', socket.id);
      });

      // Alert subscription
      socket.on('subscribe_alerts', (types: AlertType[]) => {
        types.forEach(type => {
          socket.join(`alert_${type}`);
        });
        socket.emit('alerts_subscribed', { types });
      });

      // Alert unsubscription
      socket.on('unsubscribe_alerts', (types: AlertType[]) => {
        types.forEach(type => {
          socket.leave(`alert_${type}`);
        });
        socket.emit('alerts_unsubscribed', { types });
      });
    });
  }

  private registerUserSocket(userId: string, socketId: string) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, []);
    }
    this.userSockets.get(userId)!.push(socketId);
  }

  private unregisterSocket(socketId: string) {
    for (const [userId, sockets] of this.userSockets.entries()) {
      const index = sockets.indexOf(socketId);
      if (index > -1) {
        sockets.splice(index, 1);
        if (sockets.length === 0) {
          this.userSockets.delete(userId);
        }
      }
    }
  }

  // Send real-time alert
  async sendAlert(payload: AlertPayload): Promise<string> {
    try {
      // Create alert in database
      const alert = await db.alert.create({
        data: {
          type: payload.type,
          message: payload.message,
          analysisId: payload.analysisId || '',
          status: AlertStatus.PENDING,
        },
      });

      // Prepare alert data for real-time transmission
      const alertData = {
        id: alert.id,
        type: alert.type,
        message: alert.message,
        status: alert.status,
        priority: payload.priority || this.getAlertPriority(payload.type),
        data: payload.data,
        timestamp: alert.createdAt.toISOString(),
      };

      // Send to specific user if userId provided
      if (payload.userId) {
        const userSockets = this.userSockets.get(payload.userId);
        if (userSockets) {
          userSockets.forEach(socketId => {
            this.io.to(socketId).emit('alert', alertData);
          });
        }
      }

      // Send to alert type room
      this.io.to(`alert_${payload.type}`).emit('alert', alertData);

      // Send to admin users for system alerts
      if (this.isAdminAlert(payload.type)) {
        await this.sendToAdminUsers(alertData);
      }

      // Update alert status to sent
      await db.alert.update({
        where: { id: alert.id },
        data: { status: AlertStatus.SENT },
      });

      console.log('Alert sent successfully:', alert.id);
      return alert.id;
    } catch (error) {
      console.error('Failed to send alert:', error);
      throw error;
    }
  }

  // Send analysis completion alert
  async sendAnalysisCompletionAlert(analysisId: string, userId: string, result: any) {
    return this.sendAlert({
      type: AlertType.ANALYSIS_COMPLETED,
      message: `Analysis completed for ${result.techStack || 'unknown'} environment`,
      userId,
      analysisId,
      data: {
        confidence: result.confidence,
        source: result.source,
        techStack: result.techStack,
        environment: result.environment,
      },
      priority: result.confidence > 0.8 ? 'high' : 'medium',
    });
  }

  // Send analysis failure alert
  async sendAnalysisFailureAlert(analysisId: string, userId: string, error: string) {
    return this.sendAlert({
      type: AlertType.ANALYSIS_FAILED,
      message: `Analysis failed: ${error}`,
      userId,
      analysisId,
      data: { error },
      priority: 'high',
    });
  }

  // Send OCR completion alert
  async sendOCRCompletionAlert(userId: string, result: any) {
    return this.sendAlert({
      type: AlertType.OCR_COMPLETED,
      message: `OCR processing completed - ${result.isLogContent ? 'Log content detected' : 'General text detected'}`,
      userId,
      data: {
        confidence: result.confidence,
        isLogContent: result.isLogContent,
        suggestedAnalysis: result.suggestedAnalysis,
      },
      priority: result.confidence > 0.8 ? 'medium' : 'low',
    });
  }

  // Send security alert
  async sendSecurityAlert(message: string, userId?: string, data?: any) {
    return this.sendAlert({
      type: AlertType.SECURITY_ALERT,
      message,
      userId,
      data,
      priority: 'critical',
    });
  }

  // Send system alert
  async sendSystemAlert(message: string, data?: any) {
    return this.sendAlert({
      type: AlertType.SYSTEM_ALERT,
      message,
      data,
      priority: 'high',
    });
  }

  // Get user alerts
  async getUserAlerts(userId: string, limit: number = 50, offset: number = 0) {
    return await db.alert.findMany({
      where: {
        analysis: {
          userId: userId,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
      include: {
        analysis: {
          select: {
            id: true,
            title: true,
            techStack: true,
            environment: true,
            createdAt: true,
          },
        },
      },
    });
  }

  // Get system alerts (admin only)
  async getSystemAlerts(limit: number = 50, offset: number = 0) {
    return await db.alert.findMany({
      where: {
        OR: [
          { type: AlertType.SYSTEM_ALERT },
          { type: AlertType.SECURITY_ALERT },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });
  }

  // Mark alert as read
  async markAlertAsRead(alertId: string) {
    return await db.alert.update({
      where: { id: alertId },
      data: { status: AlertStatus.SENT },
    });
  }

  // Get alert statistics
  async getAlertStatistics(userId?: string) {
    const whereClause = userId
      ? {
        analysis: {
          userId: userId,
        },
      }
      : {};

    const [total, pending, sent, failed] = await Promise.all([
      db.alert.count({ where: whereClause }),
      db.alert.count({ where: { ...whereClause, status: AlertStatus.PENDING } }),
      db.alert.count({ where: { ...whereClause, status: AlertStatus.SENT } }),
      db.alert.count({ where: { ...whereClause, status: AlertStatus.FAILED } }),
    ]);

    const typeCounts = await db.alert.groupBy({
      by: ['type'],
      where: whereClause,
      _count: { type: true },
    });

    return {
      total,
      pending,
      sent,
      failed,
      byType: typeCounts.reduce((acc, item) => {
        acc[item.type] = item._count.type;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  private getAlertPriority(type: AlertType): 'low' | 'medium' | 'high' | 'critical' {
    switch (type) {
      case AlertType.SECURITY_ALERT:
        return 'critical';
      case AlertType.SYSTEM_ALERT:
      case AlertType.ANALYSIS_FAILED:
        return 'high';
      case AlertType.ANALYSIS_COMPLETED:
        return 'medium';
      case AlertType.OCR_COMPLETED:
        return 'low';
      default:
        return 'medium';
    }
  }

  private isAdminAlert(type: AlertType): boolean {
    return [AlertType.SECURITY_ALERT, AlertType.SYSTEM_ALERT].includes(type as any);
  }

  private async sendToAdminUsers(alertData: any) {
    try {
      // Get all admin users
      const adminUsers = await db.user.findMany({
        where: {
          role: {
            in: ['ADMIN', 'SUPER_ADMIN'],
          },
        },
      });

      // Send alert to all admin users
      adminUsers.forEach(user => {
        const userSockets = this.userSockets.get(user.id);
        if (userSockets) {
          userSockets.forEach(socketId => {
            this.io.to(socketId).emit('admin_alert', alertData);
          });
        }
      });
    } catch (error) {
      console.error('Failed to send alert to admin users:', error);
    }
  }
}

// Global alert manager instance
let alertManager: RealTimeAlertManager | null = null;

export function initializeAlertManager(io: Server): RealTimeAlertManager {
  if (!alertManager) {
    alertManager = new RealTimeAlertManager(io);
  }
  return alertManager;
}

export function getAlertManager(): RealTimeAlertManager | null {
  return alertManager;
}