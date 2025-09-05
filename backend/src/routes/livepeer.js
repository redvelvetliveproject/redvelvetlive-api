import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Generar un nuevo stream en Livepeer
router.post('/create-stream', async (req, res) => {
  try {
    const response = await fetch('https://livepeer.studio/api/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LIVEPEER_API_KEY}`
      },
      body: JSON.stringify({
        name: req.body.name || 'RedVelvetLive Stream'
      })
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creando el stream en Livepeer' });
  }
});

export default router;
