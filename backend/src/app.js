// backend/src/app.js
import express from 'express';

const app = express();

// healthcheck simple
app.get('/api/health', (req, res) => {
  res.status(200).json({ ok: true, status: 'healthy', ts: new Date().toISOString() });
});

export default app;
