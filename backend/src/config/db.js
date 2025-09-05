// backend/src/config/db.js
let connected = false;

export default async function connectDB() {
  // No te frena si no hay MONGO_URI; evita 500 en serverless
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.log('MONGO_URI not set - skipping DB connection.');
    return;
  }
  if (connected) return;

  // Cargas mongoose solo si es necesario
  const mongoose = (await import('mongoose')).default;
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  connected = true;
  console.log('MongoDB connected');
}
