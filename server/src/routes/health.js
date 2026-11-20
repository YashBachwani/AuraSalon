import { Router } from 'express';
import { getConnectedClientCount } from '../socket/index.js';
import { env } from '../config/env.js';

export function createHealthRouter(db) {
  const router = Router();

  router.get('/', async (_req, res, next) => {
    try {
      await db.execute('SELECT 1 AS ok');
      const settingsRes = await db.execute(
        'SELECT salon_name_en, salon_name_gu, open_time, close_time FROM salon_settings WHERE id = 1'
      );
      const settings = settingsRes.rows[0] || null;

      res.json({
        status: 'ok',
        service: 'salon-queue-server',
        database: {
          engine: 'sqlite-libsql',
          connected: true,
        },
        realtime: {
          transport: 'socket.io',
          connectedClients: getConnectedClientCount(),
        },
        salon: settings
          ? {
              nameEn: settings.salon_name_en,
              nameGu: settings.salon_name_gu,
              openTime: settings.open_time,
              closeTime: settings.close_time,
            }
          : null,
        timezone: env.salonTimezone,
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
