import { Router } from 'express';
import { authenticateUser, requireAuth } from '../middleware/authMiddleware.js';
import { getOwnerAnalytics } from '../services/analyticsService.js';
import { broadcastEvent } from '../socket/index.js';

export function createAdminRouter(db) {
  const router = Router();

  // All admin endpoints require authentication and strict 'owner' role
  router.use(authenticateUser);
  router.use(requireAuth(['owner']));

  // ==========================================
  // OWNER ANALYTICS
  // ==========================================

  // GET /api/admin/analytics?range=today|7d|30d|all
  router.get('/analytics', async (req, res, next) => {
    try {
      const range = req.query.range || 'today';
      const analytics = await getOwnerAnalytics(db, { range });
      res.json({ ok: true, analytics });
    } catch (err) {
      next(err);
    }
  });

  // ==========================================
  // SERVICES MANAGEMENT
  // ==========================================

  // GET /api/admin/services
  router.get('/services', async (_req, res, next) => {
    try {
      const servicesRes = await db.execute('SELECT * FROM services ORDER BY id ASC');
      const queueEntriesRes = await db.execute('SELECT services_snapshot_json FROM queue_entries');

      // Calculate usage count for each service
      const usageCountMap = {};
      for (const row of queueEntriesRes.rows) {
        try {
          const arr = JSON.parse(row.services_snapshot_json || '[]');
          for (const s of arr) {
            usageCountMap[s.id] = (usageCountMap[s.id] || 0) + 1;
          }
        } catch {}
      }

      const services = servicesRes.rows.map((s) => ({
        id: Number(s.id),
        nameEn: s.name_en,
        nameGu: s.name_gu,
        descriptionEn: s.description_en || '',
        descriptionGu: s.description_gu || '',
        durationMinutes: Number(s.duration_minutes),
        priceInr: Number(s.price_inr),
        isActive: Boolean(s.is_active),
        usageCount: usageCountMap[Number(s.id)] || 0,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      }));

      res.json({ ok: true, services });
    } catch (err) {
      next(err);
    }
  });

  // POST /api/admin/services
  router.post('/services', async (req, res, next) => {
    try {
      const {
        nameEn,
        nameGu,
        descriptionEn = '',
        descriptionGu = '',
        durationMinutes,
        priceInr,
        isActive = true,
      } = req.body || {};

      const trimmedNameEn = String(nameEn || '').trim();
      const trimmedNameGu = String(nameGu || '').trim() || trimmedNameEn;
      const duration = Number(durationMinutes);
      const price = Number(priceInr);

      if (!trimmedNameEn || trimmedNameEn.length < 2 || trimmedNameEn.length > 60) {
        return res.status(400).json({
          ok: false,
          error: 'INVALID_SERVICE_NAME',
          message: 'Service name (English) is required (2-60 characters).',
        });
      }

      if (!duration || isNaN(duration) || duration <= 0 || duration > 240) {
        return res.status(400).json({
          ok: false,
          error: 'INVALID_DURATION',
          message: 'Service duration must be between 1 and 240 minutes.',
        });
      }

      if (isNaN(price) || price < 0 || price > 100000) {
        return res.status(400).json({
          ok: false,
          error: 'INVALID_PRICE',
          message: 'Price must be a valid non-negative amount (₹0 - ₹100,000).',
        });
      }

      const insertRes = await db.execute({
        sql: `INSERT INTO services (name_en, name_gu, description_en, description_gu, duration_minutes, price_inr, is_active)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          trimmedNameEn,
          trimmedNameGu,
          String(descriptionEn || '').trim(),
          String(descriptionGu || '').trim(),
          duration,
          price,
          isActive ? 1 : 0,
        ],
      });

      const newId = Number(insertRes.lastInsertRowid);
      const createdRes = await db.execute({
        sql: 'SELECT * FROM services WHERE id = ?',
        args: [newId],
      });
      const s = createdRes.rows[0];

      broadcastEvent('services:updated', { action: 'CREATED', id: newId });
      broadcastEvent('bootstrap:updated', {});

      res.status(201).json({
        ok: true,
        service: {
          id: Number(s.id),
          nameEn: s.name_en,
          nameGu: s.name_gu,
          descriptionEn: s.description_en || '',
          descriptionGu: s.description_gu || '',
          durationMinutes: Number(s.duration_minutes),
          priceInr: Number(s.price_inr),
          isActive: Boolean(s.is_active),
          usageCount: 0,
          createdAt: s.created_at,
          updatedAt: s.updated_at,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  // PUT /api/admin/services/:id
  router.put('/services/:id', async (req, res, next) => {
    try {
      const sId = Number(req.params.id);
      const existingRes = await db.execute({
        sql: 'SELECT * FROM services WHERE id = ?',
        args: [sId],
      });

      if (existingRes.rows.length === 0) {
        return res.status(404).json({
          ok: false,
          error: 'SERVICE_NOT_FOUND',
          message: 'The requested service was not found.',
        });
      }

      const existing = existingRes.rows[0];
      const {
        nameEn = existing.name_en,
        nameGu = existing.name_gu,
        descriptionEn = existing.description_en || '',
        descriptionGu = existing.description_gu || '',
        durationMinutes = existing.duration_minutes,
        priceInr = existing.price_inr,
        isActive = existing.is_active,
      } = req.body || {};

      const trimmedNameEn = String(nameEn || '').trim();
      const trimmedNameGu = String(nameGu || '').trim() || trimmedNameEn;
      const duration = Number(durationMinutes);
      const price = Number(priceInr);

      if (!trimmedNameEn || trimmedNameEn.length < 2 || trimmedNameEn.length > 60) {
        return res.status(400).json({
          ok: false,
          error: 'INVALID_SERVICE_NAME',
          message: 'Service name (English) is required (2-60 characters).',
        });
      }

      if (!duration || isNaN(duration) || duration <= 0 || duration > 240) {
        return res.status(400).json({
          ok: false,
          error: 'INVALID_DURATION',
          message: 'Service duration must be between 1 and 240 minutes.',
        });
      }

      if (isNaN(price) || price < 0) {
        return res.status(400).json({
          ok: false,
          error: 'INVALID_PRICE',
          message: 'Price must be a valid non-negative amount.',
        });
      }

      const now = new Date().toISOString();
      await db.execute({
        sql: `UPDATE services
              SET name_en = ?, name_gu = ?, description_en = ?, description_gu = ?,
                  duration_minutes = ?, price_inr = ?, is_active = ?, updated_at = ?
              WHERE id = ?`,
        args: [
          trimmedNameEn,
          trimmedNameGu,
          String(descriptionEn || '').trim(),
          String(descriptionGu || '').trim(),
          duration,
          price,
          Boolean(isActive) ? 1 : 0,
          now,
          sId,
        ],
      });

      const updatedRes = await db.execute({
        sql: 'SELECT * FROM services WHERE id = ?',
        args: [sId],
      });
      const s = updatedRes.rows[0];

      broadcastEvent('services:updated', { action: 'UPDATED', id: sId });
      broadcastEvent('bootstrap:updated', {});

      res.json({
        ok: true,
        service: {
          id: Number(s.id),
          nameEn: s.name_en,
          nameGu: s.name_gu,
          descriptionEn: s.description_en || '',
          descriptionGu: s.description_gu || '',
          durationMinutes: Number(s.duration_minutes),
          priceInr: Number(s.price_inr),
          isActive: Boolean(s.is_active),
          createdAt: s.created_at,
          updatedAt: s.updated_at,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  // DELETE /api/admin/services/:id
  router.delete('/services/:id', async (req, res, next) => {
    try {
      const sId = Number(req.params.id);
      const existingRes = await db.execute({
        sql: 'SELECT * FROM services WHERE id = ?',
        args: [sId],
      });

      if (existingRes.rows.length === 0) {
        return res.status(404).json({
          ok: false,
          error: 'SERVICE_NOT_FOUND',
          message: 'Service not found.',
        });
      }

      // Check if referenced by historical or active queue entries
      const queueEntriesRes = await db.execute('SELECT services_snapshot_json FROM queue_entries');
      let isReferenced = false;
      for (const row of queueEntriesRes.rows) {
        try {
          const arr = JSON.parse(row.services_snapshot_json || '[]');
          if (arr.some((s) => Number(s.id) === sId)) {
            isReferenced = true;
            break;
          }
        } catch {}
      }

      let isSoftDeleted = false;
      if (isReferenced) {
        // Safe soft-deletion: deactivate so historical tickets are never broken
        await db.execute({
          sql: "UPDATE services SET is_active = 0, updated_at = datetime('now') WHERE id = ?",
          args: [sId],
        });
        isSoftDeleted = true;
      } else {
        // Safe permanent deletion for unreferenced services
        await db.execute({
          sql: 'DELETE FROM services WHERE id = ?',
          args: [sId],
        });
      }

      broadcastEvent('services:updated', { action: 'DELETED', id: sId, isSoftDeleted });
      broadcastEvent('bootstrap:updated', {});

      res.json({
        ok: true,
        deleted: true,
        isSoftDeleted,
        deactivated: isSoftDeleted,
        message: isSoftDeleted
          ? 'Service has historical queue references and was marked inactive to preserve past records.'
          : 'Service permanently removed.',
      });
    } catch (err) {
      next(err);
    }
  });

  // ==========================================
  // BARBERS MANAGEMENT
  // ==========================================

  // GET /api/admin/barbers
  router.get('/barbers', async (_req, res, next) => {
    try {
      const barbersRes = await db.execute('SELECT * FROM barbers ORDER BY id ASC');
      const activeEntriesRes = await db.execute(
        "SELECT id, token_number, status, customer_name, assigned_barber_id FROM queue_entries WHERE status IN ('CALLED', 'IN_CHAIR')"
      );
      const historyStatsRes = await db.execute(
        "SELECT assigned_barber_id, COUNT(*) as completed_count FROM queue_entries WHERE status = 'DONE' GROUP BY assigned_barber_id"
      );

      const activeByBarber = {};
      for (const e of activeEntriesRes.rows) {
        if (e.assigned_barber_id) {
          activeByBarber[e.assigned_barber_id] = {
            id: Number(e.id),
            tokenNumber: e.token_number,
            status: e.status,
            customerName: e.customer_name,
          };
        }
      }

      const completedByBarber = {};
      for (const h of historyStatsRes.rows) {
        if (h.assigned_barber_id) {
          completedByBarber[h.assigned_barber_id] = Number(h.completed_count);
        }
      }

      const barbers = barbersRes.rows.map((b) => ({
        id: Number(b.id),
        name: b.name,
        slug: b.slug,
        specialty: b.specialty || '',
        phone: b.phone || '',
        avatarColor: b.avatar_color,
        availability: b.availability,
        isOnDuty: Boolean(b.is_on_duty),
        hasCustomPin: Boolean(b.pin),
        activeCustomer: activeByBarber[b.id] || null,
        completedCount: completedByBarber[b.id] || 0,
        createdAt: b.created_at,
        updatedAt: b.updated_at,
      }));

      res.json({ ok: true, barbers });
    } catch (err) {
      next(err);
    }
  });

  // POST /api/admin/barbers
  router.post('/barbers', async (req, res, next) => {
    try {
      const {
        name,
        slug,
        specialty = 'Professional Stylist',
        phone = '',
        avatarColor = '#D4A017',
        pin = '1234',
        isOnDuty = true,
      } = req.body || {};

      const trimmedName = String(name || '').trim();
      if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 50) {
        return res.status(400).json({
          ok: false,
          error: 'INVALID_BARBER_NAME',
          message: 'Barber name is required (2-50 characters).',
        });
      }

      // Auto-generate or sanitize slug
      const rawSlug = slug ? String(slug) : trimmedName;
      const sanitizedSlug = rawSlug
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9_-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      if (!sanitizedSlug) {
        return res.status(400).json({
          ok: false,
          error: 'INVALID_SLUG',
          message: 'Please provide a valid alphanumeric slug for this barber.',
        });
      }

      // Check slug uniqueness
      const existingSlugRes = await db.execute({
        sql: 'SELECT id FROM barbers WHERE LOWER(slug) = ?',
        args: [sanitizedSlug],
      });

      if (existingSlugRes.rows.length > 0) {
        return res.status(409).json({
          ok: false,
          error: 'SLUG_ALREADY_EXISTS',
          message: `A barber with identifier "${sanitizedSlug}" already exists. Please choose a different identifier or name.`,
        });
      }

      const cleanedPhone = phone ? String(phone).replace(/\D/g, '') : '';
      const cleanedPin = pin ? String(pin).trim() : '1234';

      const insertRes = await db.execute({
        sql: `INSERT INTO barbers (name, slug, specialty, phone, avatar_color, availability, is_on_duty, pin)
              VALUES (?, ?, ?, ?, ?, 'AVAILABLE', ?, ?)`,
        args: [
          trimmedName,
          sanitizedSlug,
          String(specialty || '').trim(),
          cleanedPhone,
          String(avatarColor || '#D4A017').trim(),
          isOnDuty ? 1 : 0,
          cleanedPin,
        ],
      });

      const newId = Number(insertRes.lastInsertRowid);
      const bRes = await db.execute({ sql: 'SELECT * FROM barbers WHERE id = ?', args: [newId] });
      const b = bRes.rows[0];

      broadcastEvent('barbers:updated', { action: 'CREATED', id: newId });
      broadcastEvent('bootstrap:updated', {});

      res.status(201).json({
        ok: true,
        barber: {
          id: Number(b.id),
          name: b.name,
          slug: b.slug,
          specialty: b.specialty,
          phone: b.phone || '',
          avatarColor: b.avatar_color,
          availability: b.availability,
          isOnDuty: Boolean(b.is_on_duty),
          hasCustomPin: Boolean(b.pin),
          createdAt: b.created_at,
          updatedAt: b.updated_at,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  // PUT /api/admin/barbers/:id
  router.put('/barbers/:id', async (req, res, next) => {
    try {
      const bId = Number(req.params.id);
      const existingRes = await db.execute({
        sql: 'SELECT * FROM barbers WHERE id = ?',
        args: [bId],
      });

      if (existingRes.rows.length === 0) {
        return res.status(404).json({
          ok: false,
          error: 'BARBER_NOT_FOUND',
          message: 'Barber not found.',
        });
      }

      const existing = existingRes.rows[0];
      const {
        name = existing.name,
        slug = existing.slug,
        specialty = existing.specialty,
        phone = existing.phone,
        avatarColor = existing.avatar_color,
        isOnDuty = existing.is_on_duty,
        availability = existing.availability,
        pin,
      } = req.body || {};

      const trimmedName = String(name || '').trim();
      if (!trimmedName || trimmedName.length < 2) {
        return res.status(400).json({
          ok: false,
          error: 'INVALID_BARBER_NAME',
          message: 'Barber name is required (2-50 characters).',
        });
      }

      const sanitizedSlug = String(slug || existing.slug)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9_-]/g, '-');

      if (sanitizedSlug !== existing.slug) {
        const slugCheck = await db.execute({
          sql: 'SELECT id FROM barbers WHERE LOWER(slug) = ? AND id != ?',
          args: [sanitizedSlug, bId],
        });
        if (slugCheck.rows.length > 0) {
          return res.status(409).json({
            ok: false,
            error: 'SLUG_ALREADY_EXISTS',
            message: `Identifier "${sanitizedSlug}" is already in use by another barber.`,
          });
        }
      }

      const updatedPin = pin !== undefined && pin !== '' ? String(pin).trim() : existing.pin;
      const now = new Date().toISOString();

      await db.execute({
        sql: `UPDATE barbers
              SET name = ?, slug = ?, specialty = ?, phone = ?, avatar_color = ?,
                  is_on_duty = ?, availability = ?, pin = ?, updated_at = ?
              WHERE id = ?`,
        args: [
          trimmedName,
          sanitizedSlug,
          String(specialty || '').trim(),
          String(phone || '').replace(/\D/g, ''),
          String(avatarColor || existing.avatar_color).trim(),
          Boolean(isOnDuty) ? 1 : 0,
          availability || existing.availability,
          updatedPin,
          now,
          bId,
        ],
      });

      const updatedRes = await db.execute({ sql: 'SELECT * FROM barbers WHERE id = ?', args: [bId] });
      const b = updatedRes.rows[0];

      broadcastEvent('barbers:updated', { action: 'UPDATED', id: bId });
      broadcastEvent('bootstrap:updated', {});

      res.json({
        ok: true,
        barber: {
          id: Number(b.id),
          name: b.name,
          slug: b.slug,
          specialty: b.specialty,
          phone: b.phone || '',
          avatarColor: b.avatar_color,
          availability: b.availability,
          isOnDuty: Boolean(b.is_on_duty),
          hasCustomPin: Boolean(b.pin),
          updatedAt: b.updated_at,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  // DELETE /api/admin/barbers/:id
  router.delete('/barbers/:id', async (req, res, next) => {
    try {
      const bId = Number(req.params.id);
      const existingRes = await db.execute({
        sql: 'SELECT * FROM barbers WHERE id = ?',
        args: [bId],
      });

      if (existingRes.rows.length === 0) {
        return res.status(404).json({
          ok: false,
          error: 'BARBER_NOT_FOUND',
          message: 'Barber not found.',
        });
      }

      const barber = existingRes.rows[0];

      // SAFETY CHECK 1: Active customer in chair or called
      const activeCheck = await db.execute({
        sql: "SELECT id, token_number FROM queue_entries WHERE assigned_barber_id = ? AND status IN ('CALLED', 'IN_CHAIR') LIMIT 1",
        args: [bId],
      });

      if (activeCheck.rows.length > 0) {
        return res.status(409).json({
          ok: false,
          error: 'BARBER_HAS_ACTIVE_CUSTOMER',
          message: `Cannot delete or deactivate ${barber.name} while an active customer (${activeCheck.rows[0].token_number}) is in chair. Complete or reassign the service first.`,
        });
      }

      // SAFETY CHECK 2: Historical queue entries
      const histCheck = await db.execute({
        sql: 'SELECT COUNT(*) AS count FROM queue_entries WHERE preferred_barber_id = ? OR assigned_barber_id = ?',
        args: [bId, bId],
      });

      const histCount = Number(histCheck.rows[0]?.count || 0);
      let isSoftDeleted = false;

      if (histCount > 0) {
        // Safe soft-deactivation to preserve historical records
        await db.execute({
          sql: "UPDATE barbers SET is_on_duty = 0, availability = 'OFF_DUTY', updated_at = datetime('now') WHERE id = ?",
          args: [bId],
        });
        isSoftDeleted = true;
      } else {
        // Safe permanent deletion for newly created / unreferenced barbers
        await db.execute({
          sql: 'DELETE FROM barbers WHERE id = ?',
          args: [bId],
        });
      }

      broadcastEvent('barbers:updated', { action: 'DELETED', id: bId, isSoftDeleted });
      broadcastEvent('bootstrap:updated', {});

      res.json({
        ok: true,
        deleted: true,
        isSoftDeleted,
        deactivated: isSoftDeleted,
        message: isSoftDeleted
          ? `${barber.name} has historical appointments and was safely marked inactive / off-duty to preserve past records.`
          : `${barber.name} was permanently removed.`,
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
