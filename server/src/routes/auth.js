import { Router } from 'express';
import {
  authenticateCustomer,
  authenticateBarber,
  authenticateReception,
  authenticateOwner,
  getDemoCredentialsCatalog,
  revokeToken,
  AuthError,
} from '../services/authService.js';
import { authenticateUser, requireAuth } from '../middleware/authMiddleware.js';
import { getSalonCurrentTime } from '../services/queueEngine.js';

export function createAuthRouter(db) {
  const router = Router();

  // Public demo credentials list for quick login & evaluator testing
  router.get('/demo-credentials', async (_req, res, next) => {
    try {
      const catalog = await getDemoCredentialsCatalog(db);
      res.json({ ok: true, catalog });
    } catch (err) {
      next(err);
    }
  });

  // Central Role-Based Login
  router.post('/login', async (req, res, next) => {
    try {
      const { role, phone, code, barberId, pin } = req.body || {};

      let result = null;
      if (role === 'customer') {
        result = await authenticateCustomer(db, { phone, code });
      } else if (role === 'barber') {
        result = await authenticateBarber(db, { barberId, pin });
      } else if (role === 'reception') {
        result = await authenticateReception({ pin });
      } else if (role === 'owner') {
        result = await authenticateOwner({ pin });
      } else {
        return res.status(400).json({
          ok: false,
          error: 'INVALID_ROLE',
          message: 'Please provide a valid login role (customer, barber, reception, or owner).',
        });
      }

      res.json({
        ok: true,
        token: result.token,
        user: result.user,
      });
    } catch (err) {
      if (err instanceof AuthError) {
        return res.status(err.status).json({
          ok: false,
          error: err.code,
          message: err.message,
          details: err.details,
        });
      }
      next(err);
    }
  });

  // Verify and restore authenticated session
  router.get('/me', authenticateUser, async (req, res) => {
    if (!req.user) {
      return res.status(401).json({
        ok: false,
        error: 'UNAUTHORIZED',
        message: 'No active session found.',
      });
    }

    let activeTicket = null;
    if (req.user.role === 'customer' && req.user.phone) {
      const { dateString } = getSalonCurrentTime();
      const ticketRes = await db.execute({
        sql: `SELECT id, token_number, status, total_duration_minutes, total_price_inr, created_at
              FROM queue_entries
              WHERE phone = ? AND status IN ('WAITING', 'CALLED', 'IN_CHAIR')
              ORDER BY id DESC LIMIT 1`,
        args: [req.user.phone],
      });
      if (ticketRes.rows.length > 0) {
        activeTicket = ticketRes.rows[0];
      }
    }

    res.json({
      ok: true,
      user: req.user,
      activeTicket,
    });
  });

  // Logout & invalidate session
  router.post('/logout', authenticateUser, (req, res) => {
    if (req.token) {
      revokeToken(req.token);
    }
    res.json({ ok: true, message: 'Logged out successfully.' });
  });

  // Customer Profile & Queue Dashboard endpoint
  router.get('/customer/dashboard', authenticateUser, requireAuth(['customer', 'reception', 'owner']), async (req, res, next) => {
    try {
      const phone = req.query.phone || req.user.phone;
      if (!phone) {
        return res.status(400).json({ ok: false, error: 'MISSING_PHONE' });
      }

      // Customer can only view their own dashboard
      if (req.user.role === 'customer' && req.user.phone !== phone) {
        return res.status(403).json({
          ok: false,
          error: 'FORBIDDEN',
          message: 'Customers can only access their own dashboard.',
        });
      }

      const [activeRes, historyRes] = await Promise.all([
        db.execute({
          sql: `SELECT q.*, b.name as barber_name
                FROM queue_entries q
                LEFT JOIN barbers b ON q.assigned_barber_id = b.id
                WHERE q.phone = ? AND q.status IN ('WAITING', 'CALLED', 'IN_CHAIR')
                ORDER BY q.id DESC LIMIT 1`,
          args: [phone],
        }),
        db.execute({
          sql: `SELECT q.id, q.token_number, q.status, q.total_price_inr, q.services_snapshot_json, q.created_at, b.name as barber_name
                FROM queue_entries q
                LEFT JOIN barbers b ON q.assigned_barber_id = b.id
                WHERE q.phone = ? AND q.status IN ('DONE', 'NO_SHOW', 'CANCELLED')
                ORDER BY q.id DESC LIMIT 5`,
          args: [phone],
        }),
      ]);

      const activeEntry = activeRes.rows[0] || null;
      const history = historyRes.rows.map((row) => {
        let services = [];
        try {
          services = JSON.parse(row.services_snapshot_json || '[]');
        } catch {
          services = [];
        }
        return {
          id: Number(row.id),
          tokenNumber: row.token_number,
          status: row.status,
          totalPriceInr: Number(row.total_price_inr),
          barberName: row.barber_name,
          createdAt: row.created_at,
          services,
        };
      });

      res.json({
        ok: true,
        customer: {
          name: req.user.name,
          phone,
        },
        activeEntry: activeEntry
          ? {
              id: Number(activeEntry.id),
              tokenNumber: activeEntry.token_number,
              status: activeEntry.status,
              totalDurationMinutes: Number(activeEntry.total_duration_minutes),
              totalPriceInr: Number(activeEntry.total_price_inr),
              barberName: activeEntry.barber_name,
              createdAt: activeEntry.created_at,
            }
          : null,
        history,
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

