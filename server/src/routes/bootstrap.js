import { Router } from 'express';
import { env } from '../config/env.js';
import { verifyPinForRole } from '../middleware/authPin.js';

export function createBootstrapRouter(db) {
  const router = Router();

  router.get('/bootstrap', async (_req, res, next) => {
    try {
      const [settingsRes, servicesRes, barbersRes] = await Promise.all([
        db.execute(
          'SELECT salon_name_en, salon_name_gu, open_time, close_time, is_online_join_manually_closed FROM salon_settings WHERE id = 1'
        ),
        db.execute(
          'SELECT id, name_en, name_gu, duration_minutes, price_inr, is_active FROM services WHERE is_active = 1 ORDER BY id ASC'
        ),
        db.execute(
          'SELECT id, name, slug, specialty, avatar_color, availability, is_on_duty FROM barbers ORDER BY id ASC'
        ),
      ]);

      const settings = settingsRes.rows[0];
      const services = servicesRes.rows.map((s) => ({
        id: Number(s.id),
        nameEn: s.name_en,
        nameGu: s.name_gu,
        durationMinutes: Number(s.duration_minutes),
        priceInr: Number(s.price_inr),
        isActive: Boolean(s.is_active),
      }));

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
          activeServices: services.length,
          onDutyBarbers: barbersRes.rows.filter((b) => Boolean(b.is_on_duty)).length,
        },
        services,
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
