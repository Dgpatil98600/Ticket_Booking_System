
import { Server } from 'socket.io';

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  io.on('connection', (socket) => {
    console.log(` Client connected: ${socket.id}`);

    socket.on('join:event', ({ eventId }) => {
      socket.join(`event:${eventId}`);
      console.log(` Socket ${socket.id} joined event room: ${eventId}`);
    });

    socket.on('leave:event', ({ eventId }) => {
      socket.leave(`event:${eventId}`);
      console.log(` Socket ${socket.id} left event room: ${eventId}`);
    });

    socket.on('disconnect', (reason) => {
      console.log(` Client disconnected: ${socket.id}, reason: ${reason}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initSocket(server) first.');
  }
  return io;
};

const emitSeatUpdate = (eventId, event, data) => {
  try {
    if (io) {
      io.to(`event:${eventId}`).emit(event, data);
    }
  } catch (error) {
    console.error('Socket emit error:', error);
  }
};

export { initSocket, getIO, emitSeatUpdate };
