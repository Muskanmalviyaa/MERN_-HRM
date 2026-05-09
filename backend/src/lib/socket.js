import { Server } from 'socket.io';
import { logger } from './logger.js';

let io;

/**
 * Initialize Socket.IO on the given HTTP server.
 * Exposes `io` for emitting events from controllers.
 */
export const initSocketIO = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    logger.info(`🔌 Socket connected: ${socket.id}`);

    // Allow a client to join a room keyed by their userId
    // so we can send targeted real-time events
    socket.on('join:user', (userId) => {
      socket.join(`user:${userId}`);
      logger.info(`Socket ${socket.id} joined room user:${userId}`);
    });

    // Allow managers/admins to join a room for team-wide events
    socket.on('join:admin', () => {
      socket.join('admin');
      logger.info(`Socket ${socket.id} joined admin room`);
    });

    socket.on('disconnect', () => {
      logger.info(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

/**
 * Get the Socket.IO instance (after initSocketIO has been called).
 */
export const getIO = () => {
  if (!io) throw new Error('Socket.IO has not been initialized. Call initSocketIO first.');
  return io;
};
