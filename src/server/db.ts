/// <reference types="node" />
// MongoDB connection for the app's API routes (src/app/api/**/+api.ts).
//
// It is the SAME database the HomeBridge website uses, so members, passwords and contributions
// are shared. Set on the server only (Vercel / EAS env, or .env.local when developing):
//   MONGODB_URI   the Atlas connection string
//   MONGODB_DB    database name, "homebridge"
// Never prefix these with EXPO_PUBLIC_ — that would build them into the app on people's phones.

import { MongoClient, type Db } from 'mongodb';

declare global {
  // eslint-disable-next-line no-var
  var _hbMongo: Promise<MongoClient> | undefined;
}

export const isDbConfigured = () => Boolean(process.env.MONGODB_URI);

function client(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');
  // Kept on globalThis so serverless restarts and dev reloads reuse one pool.
  globalThis._hbMongo ??= new MongoClient(uri, { serverSelectionTimeoutMS: 8_000, retryWrites: true }).connect();
  return globalThis._hbMongo;
}

export async function getDb(): Promise<Db> {
  return (await client()).db(process.env.MONGODB_DB ?? 'homebridge');
}
