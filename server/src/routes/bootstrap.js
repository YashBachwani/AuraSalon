import { Router } from 'express';
import { env } from '../config/env.js';
import { verifyPinForRole } from '../middleware/authPin.js';

export function createBootstrapRouter(db) {
  const router = Router();

  router.get('/bootstrap', async (_req, res, next) => {
    try {
      const [settingsRes, servicesCountRes, barbersRes] = await Promise.all([
        db.execute(
          'SELECT salon_name_en, salon_name_gu, open_time, close_time, is_online_join_manually_closed FROM salon_settings WHERE id = 1'
        ),
        db.execute('SELECT COUNT(*) AS count FROM services WHERE is_active = 1'),
        db.execute(
          'SELECT id, name, slug, specialty, avatar_color, availability, is_on_duty FROM barbers ORDER BY id ASC'
        ),
      ]);

      const settings = settingsRes.rows[0];
      res.json({
        salon: {
          nameEn: settings?.salon_name_en || 'Aura Salon',
          nameGu: settings?.salon_name_gu || 'ઓરા સલૂન',
          openTime: settings?.open_time || '09:00',
          closeTime: settings?.close_time || '21:00',
          isOnlineJoinManuallyClosed: Boolean(settings?.is_online_join_manually_closed),
          noShowGraceMinutes: env.noShowGraceMinutes,
          timezone: env.salonTimezone,
        },
        counts: {
          activeServices: Number(servicesCountRes.rows[0]?.count || 0),
          onDutyBarbers: barbersRes.rows.filter((b) => Boolean(b.is_on_duty)).length,
        },
        barbers: barbersRes.rows.map((b) => ({
          id: Number(b.id),
          name: b.name,
          slug: b.slug,
          specialty: b.specialty,
          avatarColor: b.avatar_color,
          availability: b.availability,
          isOnDuty: Boolean(b.is_on_duty),
        })),
        serverTime: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  });

  router.post('/auth/verify-pin', (req, res) => {
    const { pin, role = 'staff' } = req.body || {};
    if (!verifyPinForRole(pin, role)) {
      return res.status(401).json({
        valid: false,
        error: 'INVALID_PIN',
        message: 'Invalid PIN. Please try again.',
      });
    }

    return res.json({
      valid: true,
      role: role === 'owner' ? 'owner' : 'staff',
    });
  });

  return router;
}
