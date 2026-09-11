import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri);
  // eslint-disable-next-line no-console
  console.log(`[DB] Connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  return mongoose.connection;
}

export function dbState() {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return states[mongoose.connection.readyState] || 'unknown';
}
