// backend/src/app.js
import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import pinoHttp from 'pino-http';

import ping from './routes/ping.js';
import connectDB from './config/db.js';

const app = express();
app.set('trust proxy', 1);

// Middlewares básicos y seguros
app.use(pinoHttp());
app.use(cors({ origin: '*', credentials: false }));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// Healthcheck (¡sin tocar DB!)
app.get('/api/health', (req, res) => {
  res.status(200).json({ ok: true, status: 'healthy', ts: new Date().toISOString() });
});

// Rutas mínimas
app.use('/api', ping);

// Conexión a DB (opcional y tolerante a errores)
// No bloquea el health; si falla, lo deja registrado y la API sigue viva.
try {
  await connectDB();
} catch (e) {
  req?.log?.error?.(e, 'DB connect error'); // si no hay req, no pasa nada
  // eslint-disable-next-line no-console
  console.error('DB connect error:', e?.message || e);
}

// 404
app.use((req, res) => {
  res.status(404).json({ ok: false, error: 'Not found' });
});

// Manejo de errores
app.use((err, req, res, _next) => {
  req.log?.error({ err }, 'Unhandled error');
  const status = err.status || 500;
  res.status(status).json({ ok: false, error: err.message || 'Internal error' });
});

export default app;
