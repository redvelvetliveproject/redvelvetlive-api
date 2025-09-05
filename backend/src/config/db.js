import mongoose from 'mongoose';

let cached = global._mongoose || { conn: null, promise: null };
global._mongoose = cached;

export default async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const uri = process.env.MONGO_URI;
    const dbName = process.env.MONGO_DB_NAME || 'redvelvetlive';
    if (!uri) throw new Error('MONGO_URI not set');
    cached.promise = mongoose.connect(uri, {
      dbName,
      autoIndex: true,
      bufferCommands: false,
    }).then((m) => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
