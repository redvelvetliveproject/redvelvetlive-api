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

// Logs, CORS, seguridad
app.use(pinoHttp({ logger }));
app.use(buildCors());
security(app);

// Parsers
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// CSRF
mountCsrf(app, { basePath: '/api' });

// DB (lazy + cache para serverless)
app.use(async (_req, _res, next) => {
  try { await connectDB(); next(); }
  catch (err) { next(err); }
});

// API
app.use('/api/v1', apiV1);
app.use('/api', apiV1);

// Sitemap dinámico
app.use('/', sitemapPostsRouter);

// Ping de salud (prueba rápida)
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Alias de perfil
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
app.use((req, res) => res.status(404).json({ ok: false, error: 'Not found' }));

// Handler de errores
app.use((err, req, res, _next) => {
  req.log?.error({ err }, 'Unhandled error');
  const status = err.status || 500;
  const msg = err.code === 'EBADCSRFTOKEN' ? 'CSRF token invalid' : (err.message || 'Internal error');
  res.status(status).json({ ok: false, error: msg });
});

export default app;
