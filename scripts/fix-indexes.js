// scripts/fix-indexes.js
import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URI;
const dbName = "redvelvetdb";

if (!uri) {
  console.error("❌ MONGO_URI no definido en .env");
  process.exit(1);
}

const run = async () => {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);

    const users = db.collection("users");
    const sessions = db.collection("sessions");

    console.log("🧹 Limpiando índices en 'users'...");
    const ui = await users.indexes();
    for (const idx of ui) {
      if (["email_1", "wallet_1"].includes(idx.name) && !idx.unique) {
        await users.dropIndex(idx.name).catch(() => {});
      }
    }
    await users.createIndex({ email: 1 }, { unique: true, sparse: true });
    await users.createIndex({ wallet: 1 }, { unique: true, sparse: true });
    await users.createIndex({ name: "text", slug: "text" });
    await users.createIndex({ country: 1, locale: 1, popularity: -1 });

    console.log("🧹 Limpiando índices en 'sessions'...");
    const si = await sessions.indexes();
    for (const idx of si) {
      if (idx.name === "expiresAt_1" && !("expireAfterSeconds" in idx)) {
        await sessions.dropIndex(idx.name).catch(() => {});
      }
    }
    await sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

    console.log("✅ Índices corregidos.");
    process.exit(0);
  } catch (e) {
    console.error("❌ Error corrigiendo índices:", e.message);
    process.exit(1);
  } finally {
    await client.close();
  }
};

run();
