import { Router } from 'express';
import { authenticateUser, requireAuth } from '../middleware/authMiddleware.js';
import { getOwnerAnalytics } from '../services/analyticsService.js';

export function createAdminRouter(db) {
  const router = Router();

  // All admin endpoints require authentication and strict 'owner' role
  router.use(authenticateUser);
  router.use(requireAuth(['owner']));

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

  return router;
}
