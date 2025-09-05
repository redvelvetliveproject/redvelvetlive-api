// backend/src/app.js
import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';

import logger from './config/logger.js';
import buildCors from './config/cors.js';
import security from './config/security.js';
import { mountCsrf } from './config/csrf.js';
import connectDB from './config/db.js';

import apiV1 from './routes/index.js';
import sitemapPostsRouter from './routes/sitemap.posts.js';
import { auth } from './middlewares/auth.js';
import User from './models/User.js';

const app = express();
app.set('trust proxy', 1);

// logs, cors, seguridad
app.use(pinoHttp({ logger }));
app.use(buildCors());
security(app);

// parsers
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// CSRF en /api
mountCsrf(app, { basePath: '/api' });

// Conexión a DB (con cache interno en connectDB para no reconectar en cada invocación)
await connectDB();

// Rutas
app.use('/api/v1', apiV1);
app.use('/api', apiV1);
app.use('/', sitemapPostsRouter);

// Alias rápido
app.get('/api/users/profile', auth, async (req, res) => {
  const user = await User.findById(req.user.id).lean();
  if (!user) return res.status(404).json({ ok: false, error: 'User not found' });
  res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    wallet: user.wallet,
    role: user.role,
    locale: user.locale || 'es',
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ ok: false, error: 'Not found' });
});

// Errores
app.use((err, req, res, _next) => {
  req.log?.error({ err }, 'Unhandled error');
  const status = err.status || 500;
  const msg = err.code === 'EBADCSRFTOKEN' ? 'CSRF token invalid' : (err.message || 'Internal error');
  res.status(status).json({ ok: false, error: msg });
});

export default app;

