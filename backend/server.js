/**
 * TicketMaster Backend Server
 * Main entry point
 *
 * Architecture:
 * - Express.js REST API
 * - Socket.io for real-time seat updates
 * - MongoDB via Mongoose
 * - node-cron for scheduled jobs (seat hold TTL, waitlist expiry)
 */

import 'dotenv/config.js';

import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

import connectDB from './src/config/database.js';
import mongoose from 'mongoose';
import { initSocket } from './src/config/socket.js';
import { notFound, errorHandler } from './src/middlewares/error.middleware.js';

// Route imports
import authRoutes from './src/routes/auth.routes.js';
import venueRoutes from './src/routes/venue.routes.js';
import eventRoutes from './src/routes/event.routes.js';
import seatRoutes from './src/routes/seat.routes.js';
import bookingRoutes from './src/routes/booking.routes.js';
import waitlistRoutes from './src/routes/waitlist.routes.js';
import dashboardRoutes from './src/routes/dashboard.routes.js';

// Cron jobs
import { startSeatHoldReleaseCron } from './src/jobs/seatHoldRelease.job.js';
import { startWaitlistExpiryCleanup } from './src/jobs/waitlistExpiry.job.js';

// ── App Setup ──────────────────────────────────────────────────────────────

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// ── Middleware ─────────────────────────────────────────────────────────────

// Security
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Health Check ───────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
  });
});

app.get('/api', (req, res) => {
  res.json({
    message: 'TicketMaster API v1.0.0',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      venues: '/api/venues',
      events: '/api/events',
      seats: '/api/seats',
      bookings: '/api/bookings',
      waitlists: '/api/waitlists',
      dashboard: '/api/dashboard',
    },
  });
});

// ── Routes ─────────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/seats', seatRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/waitlists', waitlistRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ── Error Handling ─────────────────────────────────────────────────────────

app.use(notFound);
app.use(errorHandler);

// ── Server Start ───────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start the server
    server.listen(PORT, () => {
      console.log('\n TicketMaster Backend Server Started');
      console.log(` Server: http://localhost:${PORT}`);
      console.log(` Environment: ${process.env.NODE_ENV}`);
      console.log(` Socket.io: enabled`);
      console.log(` Cron jobs: starting...\n`);

      // Start scheduled jobs
      startSeatHoldReleaseCron();
      startWaitlistExpiryCleanup();

      console.log('\n✅ All systems operational\n');
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n Received ${signal}. Shutting down gracefully...`);
      
      // Force exit after 5 seconds if graceful shutdown hangs
      setTimeout(() => {
        console.error(' Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 5000);

      server.close(async () => {
        console.log(' HTTP server closed');
        try {
          await mongoose.connection.close();
          console.log(' MongoDB connection closed');
          process.exit(0);
        } catch (err) {
          console.error('❌ Error during shutdown:', err);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export { app, server };
