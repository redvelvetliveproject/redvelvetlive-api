// scripts/fix-indexes.js
/**
 * 🧹 Fix MongoDB Indexes (PRO)
 * - Carga .env desde backend/.env (independiente del CWD/PM2)
 * - Conecta a Mongo y sincroniza índices con Model.syncIndexes()
 * - Ignora colecciones que no existan (evita "ns does not exist")
 * - Fallback: elimina índices "sospechosos" repetidos si quedaron residuos
 *
 * Ejecuta:
 *   node --env-file=backend/.env scripts/fix-indexes.js
 *
 * Sugerencia: añade en package.json:
 *   "scripts": { "fix:indexes": "node --env-file=backend/.env scripts/fix-indexes.js" }
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// 1) Carga .env desde backend/.env
const envPath = path.join(__dirname, '..', 'backend', '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  console.warn(`⚠️  No se encontró ${envPath}. Asegúrate de tener backend/.env`);
}

// 2) Conecta a Mongo
const uri = process.env.MONGO_URI || process.env.DATABASE_URL || process.env.MONGODB_URI;
if (!uri) {
  console.error('❌ MONGO_URI no definido en backend/.env');
  process.exit(1);
}

mongoose.set('strictQuery', true);

async function connect() {
  console.log('🔌 Conectando a MongoDB...');
  await mongoose.connect(uri, {
    // Node MongoDB Driver v4+: estas opciones ya no son necesarias
    // se mantienen limpios para evitar warnings
  });
  console.log('✅ Conectado a MongoDB\n');
}

// 3) Carga dinámica de modelos que existan (no revienta si falta alguno)
async function tryImportModel(relPath, exportName = 'default') {
  const absPath = path.join(__dirname, '..', 'backend', 'src', 'models', relPath);
  try {
    await fs.promises.access(absPath, fs.constants.R_OK);
  } catch {
    return null; // archivo no existe => ignorar
  }
  try {
    const mod = await import(absPath);
    return exportName === 'default' ? (mod.default ?? null) : (mod[exportName] ?? null);
  } catch (e) {
    console.warn(`⚠️  No se pudo importar ${relPath}: ${e.message}`);
    return null;
  }
}

// 4) Devuelve true si la colección existe físicamente
async function collectionExists(collectionName) {
  const collections = await mongoose.connection.db.listCollections().toArray();
  return collections.some(c => c.name === collectionName);
}

// 5) Sincroniza índices de un modelo (si existe archivo y colección)
async function syncModelIndexes(Model, modelName) {
  if (!Model) return;

  const coll = Model.collection?.collectionName || Model.collection?.name || modelName.toLowerCase() + 's';

  const exists = await collectionExists(coll);
  if (!exists) {
    console.log(`ℹ️  Colección inexistente, se crea en primer insert: '${coll}'. Saltando drop de índices...`);
  }

  console.log(`🔁 Sincronizando índices para '${coll}' (${modelName})...`);
  try {
    // ¡La clave! Reconciliar según Schema actual
    const res = await Model.syncIndexes();
    console.log(`✅ syncIndexes OK ->`, res);
  } catch (e) {
    console.warn(`⚠️  syncIndexes lanzó un warning en '${coll}': ${e.message}`);
  }
}

// 6) Fallback: limpieza de índices “sospechosos” duplicados (si quedara residuo)
//    Solo intentamos si la colección existe
async function dropSuspicious(Model, modelName, fields) {
  if (!Model) return;
  const coll = Model.collection.collectionName;
  const exists = await collectionExists(coll);
  if (!exists) return;

  const idx = await Model.collection.indexes();
  const indexNames = idx.map(i => i.name);

  // Construye posibles nombres de índices que a veces quedan duplicados
  // (Mongoose genera nombres predictibles: field_1, field_1_2, etc.)
  const candidates = new Set();
  fields.forEach(f => {
    candidates.add(`${f}_1`);
    candidates.add(`${f}_-1`);
    candidates.add(`${f}.1`); // por si hubiera anidados raros
  });

  // Evita borrar índices esenciales
  const keep = new Set(['_id_', 'uniq_user_wallet']);

  for (const name of indexNames) {
    if (keep.has(name)) continue;
    for (const cand of candidates) {
      // si el nombre de índice contiene el campo de forma obvia y sabemos que ya lo definimos correcto en schema
      if (name === cand) {
        try {
          console.log(`🧹 Eliminando índice residual '${name}' de '${coll}'...`);
          await Model.collection.dropIndex(name);
        } catch (e) {
          console.warn(`⚠️  No se pudo eliminar '${name}' en '${coll}': ${e.message}`);
        }
      }
    }
  }
}

async function main() {
  await connect();

  // Intenta cargar todos los modelos habituales si existen en tu repo
  const [
    User,
    ModelProfile,     // suele ser models/Model.js
    Payment,
    Subscription,
    Stream,
    Tip,
    Ticket,
    Wallet,
    Notification,
    RefreshToken,
    WalletChallenge,
    Post,
    Session,          // si tienes sesiones en DB (e.g. express-session store)
  ] = await Promise.all([
    tryImportModel('User.js'),
    tryImportModel('Model.js'),
    tryImportModel('Payment.js'),
    tryImportModel('Subscription.js'),
    tryImportModel('Stream.js'),
    tryImportModel('Tip.js'),
    tryImportModel('Ticket.js'),
    tryImportModel('Wallet.js'),
    tryImportModel('Notification.js'),
    tryImportModel('RefreshToken.js'),
    tryImportModel('WalletChallenge.js'),
    tryImportModel('Post.js'),
    tryImportModel('Session.js'),
  ]);

  // Sincroniza índices de todos los modelos presentes
  const pairs = [
    [User,            'User'],
    [ModelProfile,    'Model'],
    [Payment,         'Payment'],
    [Subscription,    'Subscription'],
    [Stream,          'Stream'],
    [Tip,             'Tip'],
    [Ticket,          'Ticket'],
    [Wallet,          'Wallet'],
    [Notification,    'Notification'],
    [RefreshToken,    'RefreshToken'],
    [WalletChallenge, 'WalletChallenge'],
    [Post,            'Post'],
    [Session,         'Session'],
  ];

  for (const [M, name] of pairs) {
    await syncModelIndexes(M, name);
  }

  // Limpieza Fallback: SOLO si han quedado residuos duplicados comunes
  // (ajusta los campos según lo que veías en logs)
  await dropSuspicious(User,         'User',         ['email', 'wallet', 'status', 'role', 'country', 'popularity', 'expiresAt']);
  await dropSuspicious(ModelProfile, 'Model',        ['status', 'featured', 'ambassador', 'type', 'currency']);
  await dropSuspicious(Payment,      'Payment',      ['status', 'currency', 'intentId', 'txHash']);
  await dropSuspicious(Subscription, 'Subscription', ['status', 'externalId']);
  await dropSuspicious(Stream,       'Stream',       ['status', 'provider', 'assetId', 'streamId', 'playbackId']);
  await dropSuspicious(Tip,          'Tip',          ['currency', 'txHash']);
  await dropSuspicious(Ticket,       'Ticket',       ['status', 'category']);
  await dropSuspicious(Wallet,       'Wallet',       ['isPrimary', 'isVerified', 'address']);
  await dropSuspicious(Notification, 'Notification', ['type', 'readAt']);
  await dropSuspicious(RefreshToken, 'RefreshToken', ['expiresAt', 'userId']);
  await dropSuspicious(WalletChallenge,'WalletChallenge', ['expiresAt', 'used']);
  await dropSuspicious(Post,         'Post',         ['status', 'type', 'featured', 'tags']);
  await dropSuspicious(Session,      'Session',      ['expiresAt']);

  console.log('\n✅ Índices sincronizados/limpiados. Listo.');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(async (err) => {
  console.error('❌ Error corrigiendo índices:', err.message);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});

