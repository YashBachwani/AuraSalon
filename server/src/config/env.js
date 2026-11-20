import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVER_ROOT = path.resolve(__dirname, '..', '..');

const defaultDbPath = path.join(SERVER_ROOT, 'data', 'salon.db');

export const env = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || `file:${defaultDbPath}`,
  databaseAuthToken: process.env.DATABASE_AUTH_TOKEN || undefined,
  staffPin: process.env.STAFF_PIN || '1234',
  ownerPin: process.env.OWNER_PIN || '5678',
  barberPin: process.env.BARBER_PIN || '1234',
  demoCustomerPhone: process.env.DEMO_CUSTOMER_PHONE || '9876543210',
  demoCustomerCode: process.env.DEMO_CUSTOMER_CODE || '123456',
  authSecret: process.env.AUTH_SECRET || 'aura_salon_jwt_hmac_secret_key_2026',
  noShowGraceMinutes: Number(process.env.NO_SHOW_GRACE_MINUTES || 10),
  salonTimezone: process.env.SALON_TIMEZONE || 'Asia/Kolkata',
};
