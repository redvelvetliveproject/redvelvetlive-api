// backend/src/app.js
import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import pinoHttp from 'pino-http';

import connectDB from './config/db.js';
import ping from './routes/ping.js';
import livepeerRoutes from './routes/livepeer.js';
import paymentsRouter from './routes/payments.js';
import cronRouter from './routes/cron.js';

const app = express();
app.set('trust proxy', 1);

// Middlewares básicos
app.use(pinoHttp());
app.use(cors({ origin: '*', credentials: false }));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// Healthcheck (NO toca DB)
app.get('/api/health', (_req, res) => {
  res.status(200).json({ ok: true, status: 'healthy', ts: new Date().toISOString() });
});

// Rutas mínimas
app.use('/api', ping);

// Conexión a DB (tolerante a errores). No bloquea el health.
try {
  await connectDB();
} catch (e) {
  // No usar req aquí (no existe fuera de un handler)
  console.error('DB connect error:', e?.message || e);
}

// Rutas de negocio (después de intentar DB y antes del 404)
app.use('/api/livepeer', livepeerRoutes);
app.use('/api/payments', paymentsRouter);
app.use('/api/cron', cronRouter);

// 404
app.use((req, res) => {
  res.status(404).json({ ok: false, error: 'Not found' });
});

// Errores
app.use((err, req, res, _next) => {
  req.log?.error({ err }, 'Unhandled error');
  const status = err.status || 500;
  res.status(status).json({ ok: false, error: err.message || 'Internal error' });
});

export default app;

