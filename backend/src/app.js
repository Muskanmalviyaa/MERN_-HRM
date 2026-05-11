import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { morganStream } from './lib/logger.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFound } from './middlewares/notFound.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import overtimeRoutes from './routes/overtime.routes.js';
import reportsRoutes from './routes/reports.routes.js';

const app = express();
app.set('trust proxy', 1); // Support for Render/Vercel proxies

// ── Security ──────────────────────────────────────────────
app.use(helmet());
const allowedOrigins = [
  'http://localhost:5173',
  'https://mern-hrm-2.onrender.com',
  process.env.CLIENT_ORIGIN
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// ── Rate Limiting ─────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// ── Logging ───────────────────────────────────────────────
app.use(morgan('combined', { stream: morganStream }));

// ── Body Parsing ──────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health check ──────────────────────────────────────────
app.get('/api/healthz', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Root Route ──────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ 
    message: 'Attendance Management System API', 
    version: '1.0.0',
    status: 'online'
  });
});

// ── API Routes ────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/users',      userRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/overtime',   overtimeRoutes);
app.use('/api/reports',    reportsRoutes);

// ── 404 & Global Error Handler ────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
