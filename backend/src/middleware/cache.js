// backend/src/middleware/cache.js
const memoryCache = new Map();

export default function cache(seconds = 60) {
  return (req, res, next) => {
    const key = req.originalUrl;
    const cached = memoryCache.get(key);
    const now = Date.now();

    if (cached && now - cached.timestamp < seconds * 1000) {
      return res.json(cached.data);
    }

    const originalJson = res.json.bind(res);
    res.json = (data) => {
      memoryCache.set(key, { data, timestamp: now });
      originalJson(data);
    };

    next();
  };
}