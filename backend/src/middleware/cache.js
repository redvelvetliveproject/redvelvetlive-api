
/**
 * 🚀 RedVelvetLive — Cache Middleware PRO FINAL
 * ---------------------------------------------
 * ✅ Cachea automáticamente respuestas GET/HEAD para endpoints públicos
 * ⚙️ TTL configurable (por defecto 60s)
 * 🔐 Seguro y listo para producción o para escalar a Redis
 */

import crypto from "crypto";

const memoryCache = new Map();

/**
 * 🧠 Limpia automáticamente entradas expiradas
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, { timestamp, ttl }] of memoryCache.entries()) {
    if (now - timestamp > ttl) {
      memoryCache.delete(key);
    }
  }
}, 60 * 1000); // cada minuto

/**
 * 🧩 Middleware de caché
 * @param {number} seconds - Tiempo de vida (TTL) en segundos
 */
export default function cache(seconds = 60) {
  return (req, res, next) => {
    // Solo cachea métodos seguros
    if (!["GET", "HEAD"].includes(req.method)) return next();

    // Genera una clave única basada en URL y cuerpo (si aplica)
    const hashKey = crypto
      .createHash("md5")
      .update(req.originalUrl + JSON.stringify(req.query || {}))
      .digest("hex");

    const cached = memoryCache.get(hashKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < cached.ttl) {
      console.log(
        `⚡ [CACHE HIT] ${req.originalUrl} (${Math.floor(
          (cached.ttl - (now - cached.timestamp)) / 1000
        )}s restantes)`
      );
      return res.status(200).json(cached.data);
    }

    // Si no hay caché, intercepta la respuesta
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      memoryCache.set(hashKey, {
        data,
        timestamp: now,
        ttl: seconds * 1000,
      });

      console.log(`🆕 [CACHE MISS] Guardado → ${req.originalUrl} (${seconds}s)`);
      originalJson(data);
    };

    next();
  };
}
