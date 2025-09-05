// backend/src/config/db.js
import mongoose from 'mongoose';

let cached = global._mongooseConn;

export default async function connectDB() {
  if (cached && (cached.connection?.readyState === 1 || cached.connection?.readyState === 2)) {
    return cached;
  }
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn('MONGO_URI not set, skipping DB connection');
    return null;
  }

  const conn = await mongoose.connect(uri, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
  });

  global._mongooseConn = { connection: conn.connection };
  return global._mongooseConn;
}
