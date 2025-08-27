import { Server } from 'socket.io';
import { initializeAlertManager } from './alerts';
import { RealTimeOCRProcessor } from './ocr';

export const setupSocket = (io: Server) => {
  // Initialize alert manager
  const alertManager = initializeAlertManager(io);
  
  // Initialize OCR processor
  const ocrProcessor = new RealTimeOCRProcessor(io);

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Handle user registration for alerts
    socket.on('register_user', (userId: string) => {
      socket.join(`user_${userId}`);
      socket.emit('user_registered', { userId, socketId: socket.id });
    });

    // Handle messages
    socket.on('message', (msg: { text: string; senderId: string }) => {
      // Echo: broadcast message only the client who send the message
      socket.emit('message', {
        text: `Echo: ${msg.text}`,
        senderId: 'system',
        timestamp: new Date().toISOString(),
      });
    });

    // Handle OCR processing requests
    socket.on('ocr_process', (data: { id: string; imageBase64: string; userId: string }) => {
      ocrProcessor.addToQueue(data);
      ocrProcessor.processQueue();
    });

    // Handle alert subscriptions
    socket.on('subscribe_alerts', (types: string[]) => {
      types.forEach(type => {
        socket.join(`alert_${type}`);
      });
      socket.emit('alerts_subscribed', { types });
    });

    // Handle alert unsubscriptions
    socket.on('unsubscribe_alerts', (types: string[]) => {
      types.forEach(type => {
        socket.leave(`alert_${type}`);
      });
      socket.emit('alerts_unsubscribed', { types });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    // Send welcome message
    socket.emit('message', {
      text: 'Welcome to WebSocket Server with Real-time Alerts and OCR!',
      senderId: 'system',
      timestamp: new Date().toISOString(),
    });
  });

  // Send system-wide notifications
  setInterval(() => {
    io.emit('heartbeat', {
      timestamp: new Date().toISOString(),
      connectedClients: io.engine.clientsCount,
    });
  }, 30000); // Every 30 seconds
};