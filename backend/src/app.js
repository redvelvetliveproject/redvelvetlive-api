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

// -------- Middlewares base
const allowOrigin = process.env.CORS_ORIGIN || '*';
app.use(pinoHttp());
app.use(cors({ origin: allowOrigin, credentials: false }));
app.options('*', cors()); // preflight
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// -------- Health (NO toca DB)
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    ok: true,
    status: 'healthy',
    ts: new Date().toISOString(),
  });
});

// -------- Rutas mínimas
app.use('/api', ping);

// -------- Conexión DB (tolerante a fallos; no bloquea health)
try {
  await connectDB();
} catch (e) {
  // eslint-disable-next-line no-console
  console.error('DB connect error:', e?.message || e);
}

// -------- Rutas de negocio
app.use('/api/livepeer', livepeerRoutes);
app.use('/api/payments', paymentsRouter);
app.use('/api/cron', cronRouter);

// -------- 404
app.use((req, res) => {
  res.status(404).json({ ok: false, error: 'Not found' });
});

// -------- Manejo de errores
app.use((err, req, res, _next) => {
  req?.log?.error?.({ err }, 'Unhandled error');
  const status = err.status || 500;
  res.status(status).json({ ok: false, error: err.message || 'Internal error' });
});

export default app;

