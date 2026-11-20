import { Router } from 'express';
import {
  joinQueue,
  getQueue,
  getQueueEntryById,
  getBarberQueue,
  getDisplayQueue,
  callNext,
  startService,
  completeService,
  markNoShow,
  cancelQueueEntry,
  updateBarberAvailability,
  checkSalonStatus,
  QUEUE_SOURCE,
  QueueError,
} from '../services/queueEngine.js';

export function createQueueRouter(db) {
  const router = Router();

  // Check salon operating and online joining status
  router.get('/status', async (_req, res, next) => {
    try {
      const status = await checkSalonStatus(db);
      res.json(status);
    } catch (err) {
      next(err);
    }
  });

  // Online customer join
  router.post('/join', async (req, res, next) => {
    try {
      const { customerName, phone, serviceIds, preferredBarberId } = req.body || {};
      const entry = await joinQueue(db, {
        customerName,
        phone,
        serviceIds,
        preferredBarberId,
        source: QUEUE_SOURCE.ONLINE,
      });
      res.status(201).json({ ok: true, entry });
    } catch (err) {
      if (err instanceof QueueError) {
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

  // Reception walk-in registration
  router.post('/walkin', async (req, res, next) => {
    try {
      const { customerName, phone, serviceIds, preferredBarberId } = req.body || {};
      const entry = await joinQueue(db, {
        customerName,
        phone,
        serviceIds,
        preferredBarberId,
        source: QUEUE_SOURCE.WALK_IN,
      });
      res.status(201).json({ ok: true, entry });
    } catch (err) {
      if (err instanceof QueueError) {
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

  // Complete active queue (Reception View)
  router.get('/', async (req, res, next) => {
    try {
      const data = await getQueue(db, {
        businessDate: req.query.date,
        includeCompleted: req.query.includeCompleted === 'true',
      });
      res.json({ ok: true, ...data });
    } catch (err) {
      next(err);
    }
  });

  // Waiting TV Display Payload
  router.get('/display', async (_req, res, next) => {
    try {
      const data = await getDisplayQueue(db);
      res.json({ ok: true, ...data });
    } catch (err) {
      next(err);
    }
  });

  // Barber-specific queue (/barber/:name)
  router.get('/barber/:slugOrId', async (req, res, next) => {
    try {
      const data = await getBarberQueue(db, req.params.slugOrId);
      res.json({ ok: true, ...data });
    } catch (err) {
      if (err instanceof QueueError) {
        return res.status(err.status).json({
          ok: false,
          error: err.code,
          message: err.message,
        });
      }
      next(err);
    }
  });

  // Single customer status (/status/:id)
  router.get('/:id', async (req, res, next) => {
    try {
      const entry = await getQueueEntryById(db, req.params.id);
      if (!entry) {
        return res.status(404).json({
          ok: false,
          error: 'ENTRY_NOT_FOUND',
          message: 'The requested queue ticket was not found.',
        });
      }
      res.json({ ok: true, entry });
    } catch (err) {
      next(err);
    }
  });

  // Reception Call Next for barber
  router.post('/call-next', async (req, res, next) => {
    try {
      const { barberId } = req.body || {};
      if (!barberId) {
        return res.status(400).json({
          ok: false,
          error: 'MISSING_BARBER_ID',
          message: 'Please provide a valid barberId.',
        });
      }
      const entry = await callNext(db, barberId);
      res.json({ ok: true, entry });
    } catch (err) {
      if (err instanceof QueueError) {
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

  // Barber starts customer service
  router.post('/:id/start', async (req, res, next) => {
    try {
      const { barberId } = req.body || {};
      const entry = await startService(db, req.params.id, barberId);
      res.json({ ok: true, entry });
    } catch (err) {
      if (err instanceof QueueError) {
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

  // Barber completes customer service
  router.post('/:id/complete', async (req, res, next) => {
    try {
      const { barberId } = req.body || {};
      const entry = await completeService(db, req.params.id, barberId);
      res.json({ ok: true, entry });
    } catch (err) {
      if (err instanceof QueueError) {
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

  // Reception marks customer No-Show (10-minute rule)
  router.post('/:id/no-show', async (req, res, next) => {
    try {
      const entry = await markNoShow(db, req.params.id);
      res.json({ ok: true, entry });
    } catch (err) {
      if (err instanceof QueueError) {
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

  // Customer or Reception cancels queue spot
  router.post('/:id/cancel', async (req, res, next) => {
    try {
      const { reason } = req.body || {};
      const entry = await cancelQueueEntry(db, req.params.id, { reason });
      res.json({ ok: true, entry });
    } catch (err) {
      if (err instanceof QueueError) {
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

  return router;
}

export function createBarberRouter(db) {
  const router = Router();

  // Update barber availability (AVAILABLE, ON_BREAK, OFF_DUTY)
  router.patch('/:id/availability', async (req, res, next) => {
    try {
      const { availability } = req.body || {};
      const barber = await updateBarberAvailability(db, req.params.id, availability);
      res.json({ ok: true, barber });
    } catch (err) {
      if (err instanceof QueueError) {
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

  return router;
}

