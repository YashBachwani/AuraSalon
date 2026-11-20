import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@libsql/client';
import { env } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVER_ROOT = path.resolve(__dirname, '..', '..');

function normalizeDatabaseUrl(rawUrl) {
  if (!rawUrl || rawUrl === ':memory:') {
    return ':memory:';
  }

  if (rawUrl.startsWith('file:')) {
    const filePart = rawUrl.slice('file:'.length);
    const resolvedPath = path.isAbsolute(filePart)
      ? filePart
      : path.resolve(SERVER_ROOT, filePart);

    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
    return `file:${resolvedPath.replace(/\\/g, '/')}`;
  }

  return rawUrl;
}

export function createDatabaseClient(urlOverride = env.databaseUrl, authTokenOverride = env.databaseAuthToken) {
  const url = normalizeDatabaseUrl(urlOverride);
  const config = { url };

  if (authTokenOverride) {
    config.authToken = authTokenOverride;
  }

  return createClient(config);
}

export const db = createDatabaseClient();
