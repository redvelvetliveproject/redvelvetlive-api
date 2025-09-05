// backend/src/routes/ping.js
import { Router } from 'express';
const router = Router();

router.get('/ping', (_req, res) => {
  res.json({ ok: true, pong: true });
});

export default router;
