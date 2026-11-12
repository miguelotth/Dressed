import 'dotenv/config';
import { resolve } from 'node:path';

const port = Number(process.env.PORT ?? '3001');
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT inválida.');
const timeout = Number(process.env.REMBG_TIMEOUT_MS ?? '180000');
if (!Number.isFinite(timeout) || timeout < 5000 || timeout > 600000) throw new Error('REMBG_TIMEOUT_MS inválido.');
export const config = {
  port,
  databaseUrl: process.env.DATABASE_URL ?? 'postgresql://lookloop:lookloop_dev_password@localhost:5432/lookloop',
  webOrigin: (process.env.WEB_ORIGIN ?? 'http://localhost:5173').replace(/\/$/, ''),
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  rembgUrl: (process.env.REMBG_URL ?? 'http://127.0.0.1:7000').replace(/\/$/, ''),
  rembgTimeout: timeout,
  uploadDir: resolve(process.env.UPLOAD_DIR ?? './storage'),
  production: process.env.NODE_ENV === 'production',
};
if (config.production && !config.cookieSecure) throw new Error('Em produção configure COOKIE_SECURE=true e HTTPS.');
