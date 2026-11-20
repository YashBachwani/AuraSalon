/**
 * Centralized Queue Management Engine
 * Single authoritative source of truth for all queue mutations, validations,
 * concurrency controls, state transitions, and real-time event broadcasts.
 */

import { env } from '../config/env.js';
import { broadcastEvent } from '../socket/index.js';
import { calculateWaitTimesAndPositions } from './waitTimeCalculator.js';

export const BARBER_AVAILABILITY = Object.freeze({
  AVAILABLE: 'AVAILABLE',
  BUSY: 'BUSY',
  ON_BREAK: 'ON_BREAK',
  OFF_DUTY: 'OFF_DUTY',
});

export const QUEUE_STATUS = Object.freeze({
  WAITING: 'WAITING',
  CALLED: 'CALLED',
  IN_CHAIR: 'IN_CHAIR',
  DONE: 'DONE',
  NO_SHOW: 'NO_SHOW',
  CANCELLED: 'CANCELLED',
});

export const QUEUE_SOURCE = Object.freeze({
  ONLINE: 'ONLINE',
  WALK_IN: 'WALK_IN',
});

/**
 * Queue Mutex to serialize atomic mutations and prevent concurrent race conditions
 */
class AsyncMutex {
  constructor() {
    this.queue = Promise.resolve();
  }
  run(task) {
    const res = this.queue.then(() => task());
    this.queue = res.catch(() => {});
    return res;
  }
}

const queueMutex = new AsyncMutex();

export class QueueError extends Error {
  constructor(message, { status = 400, code = 'QUEUE_ERROR', details = null } = {}) {
    super(message);
    this.name = 'QueueError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Get current time and business date in salon timezone (Asia/Kolkata)
 */
export function getSalonCurrentTime(timezone = env.salonTimezone || 'Asia/Kolkata') {
  const now = new Date();
  const dateString = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now); // YYYY-MM-DD

  const timeString = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now); // HH:mm

  const [hours, minutes] = timeString.split(':').map(Number);
  const currentMinutes = hours * 60 + minutes;

  return {
    now,
    dateString,
    timeString,
    currentMinutes,
  };
}

export function formatTokenNumber(seq) {
  return `S-${String(seq).padStart(2, '0')}`;
}

function timeStringToMinutes(timeStr) {
  const [h, m] = String(timeStr || '00:00').split(':').map(Number);
  return h * 60 + (m || 0);
}

function minutesToTimeString(totalMinutes) {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Check salon operating hours and 30-min online join cutoff
 */
export async function checkSalonStatus(db) {
  const settingsRes = await db.execute(
    'SELECT salon_name_en, salon_name_gu, open_time, close_time, is_online_join_manually_closed FROM salon_settings WHERE id = 1'
  );
  const settings = settingsRes.rows[0];

  const barbersRes = await db.execute(
    'SELECT COUNT(*) AS count FROM barbers WHERE is_on_duty = 1'
  );
  const onDutyCount = Number(barbersRes.rows[0]?.count || 0);

  const { currentMinutes, timeString, dateString } = getSalonCurrentTime();
  const openMinutes = timeStringToMinutes(settings?.open_time || '09:00');
  const closeMinutes = timeStringToMinutes(settings?.close_time || '21:00');
  const autoOnlineCutoffMinutes = closeMinutes - 30;

  const isSalonOpen = currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  const isOnlineCutoffPassed = currentMinutes >= autoOnlineCutoffMinutes;
  const isManuallyClosed = Boolean(settings?.is_online_join_manually_closed);

  const isOnlineJoinOpen =
    isSalonOpen && !isOnlineCutoffPassed && !isManuallyClosed && onDutyCount > 0;

  return {
    isSalonOpen,
    isOnlineJoinOpen,
    isOnlineCutoffPassed,
    isManuallyClosed,
    onDutyBarbersCount: onDutyCount,
    currentTime: timeString,
    currentDate: dateString,
    openTime: settings?.open_time || '09:00',
    closeTime: settings?.close_time || '21:00',
    autoOnlineCutoffTime: minutesToTimeString(autoOnlineCutoffMinutes),
  };
}

/**
 * Customer / Walk-in joins the queue
 */
export async function joinQueue(
  db,
  { customerName, phone, serviceIds, preferredBarberId = null, source = QUEUE_SOURCE.ONLINE }
) {
  return queueMutex.run(async () => {
    // 1. Validate customer name
    const trimmedName = String(customerName || '').trim();
    if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 50) {
      throw new QueueError('Please enter a valid customer name (2-50 characters).', {
        status: 400,
        code: 'INVALID_NAME',
      });
    }

    // 2. Validate and normalize phone
    const cleanedPhone = String(phone || '').replace(/\D/g, '');
    if (!cleanedPhone || cleanedPhone.length !== 10) {
      throw new QueueError('Please enter a valid 10-digit mobile number.', {
        status: 400,
        code: 'INVALID_PHONE',
      });
    }

    // 3. Validate serviceIds (1 to 3 services)
    if (!Array.isArray(serviceIds) || serviceIds.length === 0 || serviceIds.length > 3) {
      throw new QueueError('Please select between 1 and 3 services.', {
        status: 400,
        code: 'INVALID_SERVICES_COUNT',
      });
    }

    const uniqueServiceIds = [...new Set(serviceIds.map(Number))];
    if (uniqueServiceIds.some(isNaN) || uniqueServiceIds.length !== serviceIds.length) {
      throw new QueueError('Invalid service IDs provided.', {
        status: 400,
        code: 'INVALID_SERVICES_PAYLOAD',
      });
    }

    // 4. Validate salon operating status & 30-min cutoff
    const salonStatus = await checkSalonStatus(db);
    if (source === QUEUE_SOURCE.ONLINE) {
      if (!salonStatus.isSalonOpen) {
        throw new QueueError('Aura Salon is currently closed.', {
          status: 403,
          code: 'SALON_CLOSED',
        });
      }
      if (!salonStatus.isOnlineJoinOpen) {
        throw new QueueError(
          'Online queue joining is currently closed. Walk-ins are still welcome at reception.',
          {
            status: 403,
            code: 'ONLINE_JOIN_CLOSED',
            details: {
              cutoffTime: salonStatus.autoOnlineCutoffTime,
              closeTime: salonStatus.closeTime,
            },
          }
        );
      }
    } else if (source === QUEUE_SOURCE.WALK_IN) {
      if (!salonStatus.isSalonOpen) {
        throw new QueueError('Salon is currently closed for walk-in registrations.', {
          status: 403,
          code: 'SALON_CLOSED',
        });
      }
    }

    // 5. Fetch and validate requested services from DB
    const placeholders = uniqueServiceIds.map(() => '?').join(',');
    const servicesRes = await db.execute({
      sql: `SELECT id, name_en, name_gu, duration_minutes, price_inr, is_active FROM services WHERE id IN (${placeholders})`,
      args: uniqueServiceIds,
    });

    if (servicesRes.rows.length !== uniqueServiceIds.length) {
      throw new QueueError('One or more selected services could not be found.', {
        status: 400,
        code: 'SERVICE_NOT_FOUND',
      });
    }

    const activeServices = servicesRes.rows.filter((s) => Boolean(s.is_active));
    if (activeServices.length !== uniqueServiceIds.length) {
      throw new QueueError('One or more selected services are currently inactive.', {
        status: 400,
        code: 'SERVICE_INACTIVE',
      });
    }

    const totalDurationMinutes = activeServices.reduce(
      (sum, s) => sum + Number(s.duration_minutes),
      0
    );
    const totalPriceInr = activeServices.reduce((sum, s) => sum + Number(s.price_inr), 0);
    const servicesSnapshot = activeServices.map((s) => ({
      id: Number(s.id),
      nameEn: s.name_en,
      nameGu: s.name_gu,
      durationMinutes: Number(s.duration_minutes),
      priceInr: Number(s.price_inr),
    }));

    // 6. Validate preferred barber
    let assignedBarberId = null;
    let preferredBarber = null;
    if (preferredBarberId !== null && preferredBarberId !== undefined && preferredBarberId !== 'any') {
      const barberIdNum = Number(preferredBarberId);
      const barberRes = await db.execute({
        sql: 'SELECT id, name, slug, specialty, avatar_color, availability, is_on_duty FROM barbers WHERE id = ?',
        args: [barberIdNum],
      });

      if (barberRes.rows.length === 0) {
        throw new QueueError('The selected barber does not exist.', {
          status: 404,
          code: 'BARBER_NOT_FOUND',
        });
      }

      preferredBarber = barberRes.rows[0];
      if (!Boolean(preferredBarber.is_on_duty) || preferredBarber.availability === BARBER_AVAILABILITY.OFF_DUTY) {
        throw new QueueError(`${preferredBarber.name} is currently off duty.`, {
          status: 409,
          code: 'BARBER_OFF_DUTY',
        });
      }

      if (preferredBarber.availability === BARBER_AVAILABILITY.ON_BREAK) {
        throw new QueueError(
          `${preferredBarber.name} is currently on break and not accepting new bookings.`,
          {
            status: 409,
            code: 'BARBER_ON_BREAK',
          }
        );
      }

      assignedBarberId = Number(preferredBarber.id);
    }

    // 7. Check duplicate active phone number
    const dupRes = await db.execute({
      sql: `SELECT id, token_number, customer_name, status, created_at FROM queue_entries
            WHERE phone = ? AND status IN ('WAITING', 'CALLED', 'IN_CHAIR')
            ORDER BY id DESC LIMIT 1`,
      args: [cleanedPhone],
    });

    if (dupRes.rows.length > 0) {
      const existing = dupRes.rows[0];
      throw new QueueError(
        `You already have an active ticket (${existing.token_number}) in the queue.`,
        {
          status: 409,
          code: 'DUPLICATE_ACTIVE_PHONE',
          details: {
            existingEntry: {
              id: Number(existing.id),
              tokenNumber: existing.token_number,
              customerName: existing.customer_name,
              status: existing.status,
            },
          },
        }
      );
    }

    // 8. Generate atomic sequential token for today's business date
    const businessDate = salonStatus.currentDate;
    const maxSeqRes = await db.execute({
      sql: 'SELECT COALESCE(MAX(token_seq), 0) AS max_seq FROM queue_entries WHERE business_date = ?',
      args: [businessDate],
    });
    const nextSeq = Number(maxSeqRes.rows[0]?.max_seq || 0) + 1;
    const tokenNumber = formatTokenNumber(nextSeq);
    const createdAt = new Date().toISOString();

    // 9. Persist into SQLite
    const insertRes = await db.execute({
      sql: `INSERT INTO queue_entries (
              business_date, token_seq, token_number, customer_name, phone,
              preferred_barber_id, assigned_barber_id, status, source,
              total_duration_minutes, total_price_inr, services_snapshot_json,
              created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'WAITING', ?, ?, ?, ?, ?)`,
      args: [
        businessDate,
        nextSeq,
        tokenNumber,
        trimmedName,
        cleanedPhone,
        preferredBarber ? preferredBarber.id : null,
        assignedBarberId,
        source,
        totalDurationMinutes,
        totalPriceInr,
        JSON.stringify(servicesSnapshot),
        createdAt,
      ],
    });

    const newId = Number(insertRes.lastInsertRowid);

    // 10. Fetch enriched entry
    const entry = await getQueueEntryById(db, newId);

    // 11. Broadcast real-time Socket.IO events
    broadcastEvent('queue:created', { entry });
    broadcastEvent('queue:updated', { reason: 'CUSTOMER_JOINED', entryId: newId });

    return entry;
  });
}

/**
 * Fetch a single queue entry by numeric ID or string token number
 */
export async function getQueueEntryById(db, idOrToken) {
  let querySql = `
    SELECT q.*,
           pb.name AS preferred_barber_name, pb.slug AS preferred_barber_slug,
           pb.avatar_color AS preferred_barber_avatar, pb.availability AS preferred_barber_avail,
           ab.name AS assigned_barber_name, ab.slug AS assigned_barber_slug,
           ab.avatar_color AS assigned_barber_avatar, ab.availability AS assigned_barber_avail
    FROM queue_entries q
    LEFT JOIN barbers pb ON q.preferred_barber_id = pb.id
    LEFT JOIN barbers ab ON q.assigned_barber_id = ab.id
  `;

  let queryArgs = [];
  if (typeof idOrToken === 'number' || /^\d+$/.test(String(idOrToken))) {
    querySql += ' WHERE q.id = ? LIMIT 1';
    queryArgs = [Number(idOrToken)];
  } else {
    querySql += ' WHERE q.token_number = ? ORDER BY q.id DESC LIMIT 1';
    queryArgs = [String(idOrToken).trim().toUpperCase()];
  }

  const res = await db.execute({ sql: querySql, args: queryArgs });
  if (res.rows.length === 0) return null;

  const row = res.rows[0];
  const { dateString } = getSalonCurrentTime();

  // If entry is WAITING, compute live queue position and wait time
  let queuePosition = 1;
  let approxWaitMinutes = 0;
  let isAlmostNext = false;

  if (row.status === QUEUE_STATUS.WAITING) {
    const allActiveRes = await db.execute({
      sql: `SELECT id, preferred_barber_id, assigned_barber_id, status, total_duration_minutes, created_at, service_started_at
            FROM queue_entries
            WHERE business_date = ? AND status IN ('WAITING', 'CALLED', 'IN_CHAIR')`,
      args: [row.business_date || dateString],
    });

    const barbersRes = await db.execute(
      'SELECT id, name, slug, availability, is_on_duty FROM barbers'
    );

    const barbers = barbersRes.rows.map((b) => ({
      id: Number(b.id),
      name: b.name,
      slug: b.slug,
      availability: b.availability,
      isOnDuty: Boolean(b.is_on_duty),
    }));

    const entries = allActiveRes.rows.map((e) => ({
      id: Number(e.id),
      preferredBarberId: e.preferred_barber_id ? Number(e.preferred_barber_id) : null,
      assignedBarberId: e.assigned_barber_id ? Number(e.assigned_barber_id) : null,
      status: e.status,
      totalDurationMinutes: Number(e.total_duration_minutes),
      createdAt: e.created_at,
      serviceStartedAt: e.service_started_at,
    }));

    const { waitingEntriesMap } = calculateWaitTimesAndPositions({
      entries,
      barbers,
      currentTime: new Date(),
    });

    const computed = waitingEntriesMap.get(Number(row.id));
    if (computed) {
      queuePosition = computed.queuePosition;
      approxWaitMinutes = computed.approxWaitMinutes;
      isAlmostNext = computed.isAlmostNext;
    }
  }

  let services = [];
  try {
    services = JSON.parse(row.services_snapshot_json || '[]');
  } catch {
    services = [];
  }

  return {
    id: Number(row.id),
    tokenSeq: Number(row.token_seq),
    tokenNumber: row.token_number,
    customerName: row.customer_name,
    phone: row.phone,
    status: row.status,
    source: row.source,
    totalDurationMinutes: Number(row.total_duration_minutes),
    totalPriceInr: Number(row.total_price_inr),
    services,
    preferredBarber: row.preferred_barber_id
      ? {
          id: Number(row.preferred_barber_id),
          name: row.preferred_barber_name,
          slug: row.preferred_barber_slug,
          avatarColor: row.preferred_barber_avatar,
          availability: row.preferred_barber_avail,
        }
      : null,
    assignedBarber: row.assigned_barber_id
      ? {
          id: Number(row.assigned_barber_id),
          name: row.assigned_barber_name,
          slug: row.assigned_barber_slug,
          avatarColor: row.assigned_barber_avatar,
          availability: row.assigned_barber_avail,
        }
      : null,
    createdAt: row.created_at,
    calledAt: row.called_at,
    serviceStartedAt: row.service_started_at,
    completedAt: row.completed_at,
    queuePosition,
    approxWaitMinutes,
    isAlmostNext,
  };
}

/**
 * Fetch the complete active queue (Reception View)
 */
export async function getQueue(db, { businessDate = null, includeCompleted = false } = {}) {
  const { dateString } = getSalonCurrentTime();
  const targetDate = businessDate || dateString;

  const statusFilter = includeCompleted
    ? `('WAITING', 'CALLED', 'IN_CHAIR', 'DONE', 'NO_SHOW', 'CANCELLED')`
    : `('WAITING', 'CALLED', 'IN_CHAIR')`;

  const [entriesRes, barbersRes] = await Promise.all([
    db.execute({
      sql: `SELECT q.*,
                   pb.name AS preferred_barber_name, pb.slug AS preferred_barber_slug,
                   pb.avatar_color AS preferred_barber_avatar, pb.availability AS preferred_barber_avail,
                   ab.name AS assigned_barber_name, ab.slug AS assigned_barber_slug,
                   ab.avatar_color AS assigned_barber_avatar, ab.availability AS assigned_barber_avail
            FROM queue_entries q
            LEFT JOIN barbers pb ON q.preferred_barber_id = pb.id
            LEFT JOIN barbers ab ON q.assigned_barber_id = ab.id
            WHERE q.business_date = ? AND q.status IN ${statusFilter}
            ORDER BY q.created_at ASC, q.id ASC`,
      args: [targetDate],
    }),
    db.execute('SELECT id, name, slug, specialty, avatar_color, availability, is_on_duty FROM barbers ORDER BY id ASC'),
  ]);

  const barbers = barbersRes.rows.map((b) => ({
    id: Number(b.id),
    name: b.name,
    slug: b.slug,
    specialty: b.specialty,
    avatarColor: b.avatar_color,
    availability: b.availability,
    isOnDuty: Boolean(b.is_on_duty),
  }));

  const rawEntries = entriesRes.rows.map((r) => ({
    id: Number(r.id),
    preferredBarberId: r.preferred_barber_id ? Number(r.preferred_barber_id) : null,
    assignedBarberId: r.assigned_barber_id ? Number(r.assigned_barber_id) : null,
    status: r.status,
    totalDurationMinutes: Number(r.total_duration_minutes),
    createdAt: r.created_at,
    serviceStartedAt: r.service_started_at,
    calledAt: r.called_at,
  }));

  const { waitingEntriesMap } = calculateWaitTimesAndPositions({
    entries: rawEntries,
    barbers,
    currentTime: new Date(),
  });

  const nowTime = Date.now();
  const gracePeriodMs = env.noShowGraceMinutes * 60 * 1000;

  const entries = entriesRes.rows.map((r) => {
    let services = [];
    try {
      services = JSON.parse(r.services_snapshot_json || '[]');
    } catch {
      services = [];
    }

    const computed = waitingEntriesMap.get(Number(r.id));
    const calledAtTime = r.called_at ? new Date(r.called_at).getTime() : null;
    const elapsedCalledMs = calledAtTime ? Math.max(0, nowTime - calledAtTime) : 0;
    const isNoShowEligible =
      r.status === QUEUE_STATUS.CALLED && elapsedCalledMs >= gracePeriodMs;

    return {
      id: Number(r.id),
      tokenSeq: Number(r.token_seq),
      tokenNumber: r.token_number,
      customerName: r.customer_name,
      phone: r.phone,
      status: r.status,
      source: r.source,
      totalDurationMinutes: Number(r.total_duration_minutes),
      totalPriceInr: Number(r.total_price_inr),
      services,
      preferredBarber: r.preferred_barber_id
        ? {
            id: Number(r.preferred_barber_id),
            name: r.preferred_barber_name,
            slug: r.preferred_barber_slug,
            avatarColor: r.preferred_barber_avatar,
            availability: r.preferred_barber_avail,
          }
        : null,
      assignedBarber: r.assigned_barber_id
        ? {
            id: Number(r.assigned_barber_id),
            name: r.assigned_barber_name,
            slug: r.assigned_barber_slug,
            avatarColor: r.assigned_barber_avatar,
            availability: r.assigned_barber_avail,
          }
        : null,
      createdAt: r.created_at,
      calledAt: r.called_at,
      serviceStartedAt: r.service_started_at,
      completedAt: r.completed_at,
      queuePosition: computed ? computed.queuePosition : null,
      approxWaitMinutes: computed ? computed.approxWaitMinutes : 0,
      isAlmostNext: computed ? computed.isAlmostNext : false,
      isNoShowEligible,
      calledElapsedSeconds: Math.floor(elapsedCalledMs / 1000),
      noShowGraceSeconds: env.noShowGraceMinutes * 60,
    };
  });

  return {
    businessDate: targetDate,
    entries,
    barbers,
    counts: {
      waiting: entries.filter((e) => e.status === QUEUE_STATUS.WAITING).length,
      called: entries.filter((e) => e.status === QUEUE_STATUS.CALLED).length,
      inChair: entries.filter((e) => e.status === QUEUE_STATUS.IN_CHAIR).length,
      totalActive: entries.length,
    },
  };
}

/**
 * Fetch queue for a specific Barber view (/barber/:name)
 */
export async function getBarberQueue(db, slugOrId) {
  let barberSql = 'SELECT * FROM barbers WHERE ';
  let barberArgs = [];
  if (typeof slugOrId === 'number' || /^\d+$/.test(String(slugOrId))) {
    barberSql += 'id = ?';
    barberArgs = [Number(slugOrId)];
  } else {
    barberSql += 'LOWER(slug) = ? OR LOWER(name) = ?';
    barberArgs = [String(slugOrId).toLowerCase(), String(slugOrId).toLowerCase()];
  }

  const barberRes = await db.execute({ sql: barberSql, args: barberArgs });
  if (barberRes.rows.length === 0) {
    throw new QueueError('Barber not found.', { status: 404, code: 'BARBER_NOT_FOUND' });
  }

  const barber = barberRes.rows[0];
  const { dateString } = getSalonCurrentTime();

  // Active customer currently assigned to this barber (CALLED or IN_CHAIR)
  const activeRes = await db.execute({
    sql: `SELECT * FROM queue_entries
          WHERE business_date = ? AND assigned_barber_id = ? AND status IN ('CALLED', 'IN_CHAIR')
          ORDER BY id DESC LIMIT 1`,
    args: [dateString, barber.id],
  });

  let currentCustomer = null;
  if (activeRes.rows.length > 0) {
    const raw = activeRes.rows[0];
    let services = [];
    try {
      services = JSON.parse(raw.services_snapshot_json || '[]');
    } catch {
      services = [];
    }
    currentCustomer = {
      id: Number(raw.id),
      tokenNumber: raw.token_number,
      customerName: raw.customer_name,
      status: raw.status,
      services,
      totalDurationMinutes: Number(raw.total_duration_minutes),
      calledAt: raw.called_at,
      serviceStartedAt: raw.service_started_at,
    };
  }

  // Upcoming waiting queue eligible for this barber:
  // 1. Preferred is this barber
  // 2. OR Preferred is null (Any Barber)
  // Strictly EXCLUDES customers who chose another barber
  const upcomingRes = await db.execute({
    sql: `SELECT * FROM queue_entries
          WHERE business_date = ? AND status = 'WAITING'
            AND (preferred_barber_id = ? OR preferred_barber_id IS NULL)
          ORDER BY created_at ASC, id ASC`,
    args: [dateString, barber.id],
  });

  const upcomingQueue = upcomingRes.rows.map((r, idx) => {
    let services = [];
    try {
      services = JSON.parse(r.services_snapshot_json || '[]');
    } catch {
      services = [];
    }
    return {
      id: Number(r.id),
      tokenNumber: r.token_number,
      customerName: r.customer_name,
      services,
      isSpecific: Boolean(r.preferred_barber_id),
      totalDurationMinutes: Number(r.total_duration_minutes),
      position: idx + 1,
      createdAt: r.created_at,
    };
  });

  return {
    barber: {
      id: Number(barber.id),
      name: barber.name,
      slug: barber.slug,
      specialty: barber.specialty,
      avatarColor: barber.avatar_color,
      availability: barber.availability,
      isOnDuty: Boolean(barber.is_on_duty),
    },
    currentCustomer,
    upcomingQueue,
  };
}

/**
 * Fetch Waiting TV Display Payload
 */
export async function getDisplayQueue(db) {
  const { dateString } = getSalonCurrentTime();

  const [barbersRes, activeRes, upcomingRes] = await Promise.all([
    db.execute('SELECT id, name, slug, specialty, avatar_color, availability, is_on_duty FROM barbers WHERE is_on_duty = 1 ORDER BY id ASC'),
    db.execute({
      sql: `SELECT q.id, q.token_number, q.customer_name, q.status, q.assigned_barber_id, q.services_snapshot_json, q.called_at
            FROM queue_entries q
            WHERE q.business_date = ? AND q.status IN ('CALLED', 'IN_CHAIR')`,
      args: [dateString],
    }),
    db.execute({
      sql: `SELECT q.id, q.token_number, q.customer_name, q.preferred_barber_id, q.services_snapshot_json, pb.name as preferred_barber_name
            FROM queue_entries q
            LEFT JOIN barbers pb ON q.preferred_barber_id = pb.id
            WHERE q.business_date = ? AND q.status = 'WAITING'
            ORDER BY q.created_at ASC, q.id ASC
            LIMIT 5`,
      args: [dateString],
    }),
  ]);

  const activeByBarber = {};
  for (const row of activeRes.rows) {
    let services = [];
    try {
      services = JSON.parse(row.services_snapshot_json || '[]');
    } catch {
      services = [];
    }
    activeByBarber[row.assigned_barber_id] = {
      entryId: Number(row.id),
      tokenNumber: row.token_number,
      customerName: row.customer_name,
      status: row.status,
      serviceNameEn: services.map((s) => s.nameEn).join(' + '),
      serviceNameGu: services.map((s) => s.nameGu).join(' + '),
      calledAt: row.called_at,
    };
  }

  const barberChairs = barbersRes.rows.map((b) => ({
    barberId: Number(b.id),
    barberName: b.name,
    avatarColor: b.avatar_color,
    availability: b.availability,
    currentCustomer: activeByBarber[b.id] || null,
  }));

  const upcomingTokens = upcomingRes.rows.map((u, idx) => ({
    id: Number(u.id),
    tokenNumber: u.token_number,
    customerName: u.customer_name,
    preferredBarberName: u.preferred_barber_name || null,
    position: idx + 1,
  }));

  return {
    chairs: barberChairs,
    upcomingTokens,
    serverTime: new Date().toISOString(),
  };
}

/**
 * Call Next customer for a barber (FCFS with preference preservation)
 */
export async function callNext(db, barberId) {
  return queueMutex.run(async () => {
    const bId = Number(barberId);
    const barberRes = await db.execute({
      sql: 'SELECT * FROM barbers WHERE id = ?',
      args: [bId],
    });

    if (barberRes.rows.length === 0) {
      throw new QueueError('Barber not found.', { status: 404, code: 'BARBER_NOT_FOUND' });
    }

    const barber = barberRes.rows[0];
    if (!Boolean(barber.is_on_duty) || barber.availability === BARBER_AVAILABILITY.OFF_DUTY) {
      throw new QueueError('Barber is off duty.', { status: 409, code: 'BARBER_OFF_DUTY' });
    }
    if (barber.availability === BARBER_AVAILABILITY.ON_BREAK) {
      throw new QueueError('Barber is currently on break.', { status: 409, code: 'BARBER_ON_BREAK' });
    }

    // Check if barber already has an active CALLED or IN_CHAIR customer
    const activeCheck = await db.execute({
      sql: `SELECT id, token_number FROM queue_entries
            WHERE assigned_barber_id = ? AND status IN ('CALLED', 'IN_CHAIR')
            LIMIT 1`,
      args: [bId],
    });

    if (activeCheck.rows.length > 0) {
      throw new QueueError(
        `${barber.name} already has an active customer in chair (${activeCheck.rows[0].token_number}).`,
        {
          status: 409,
          code: 'BARBER_HAS_ACTIVE_CUSTOMER',
        }
      );
    }

    const { dateString } = getSalonCurrentTime();

    // Query earliest WAITING customer where preferred is this barber OR Any Barber
    const nextRes = await db.execute({
      sql: `SELECT * FROM queue_entries
            WHERE business_date = ? AND status = 'WAITING'
              AND (preferred_barber_id = ? OR preferred_barber_id IS NULL)
            ORDER BY created_at ASC, id ASC
            LIMIT 1`,
      args: [dateString, bId],
    });

    if (nextRes.rows.length === 0) {
      throw new QueueError(`No eligible waiting customers for ${barber.name}.`, {
        status: 404,
        code: 'NO_ELIGIBLE_CUSTOMERS',
      });
    }

    const entry = nextRes.rows[0];
    const calledAt = new Date().toISOString();

    // Atomically transition customer to CALLED and barber to BUSY
    await db.execute({
      sql: `UPDATE queue_entries
            SET status = 'CALLED', assigned_barber_id = ?, called_at = ?
            WHERE id = ?`,
      args: [bId, calledAt, entry.id],
    });

    await db.execute({
      sql: `UPDATE barbers
            SET availability = ?, updated_at = ?
            WHERE id = ?`,
      args: [BARBER_AVAILABILITY.BUSY, calledAt, bId],
    });

    const updatedEntry = await getQueueEntryById(db, entry.id);

    // Broadcast Socket.IO events
    broadcastEvent('customer:called', {
      entryId: updatedEntry.id,
      tokenNumber: updatedEntry.tokenNumber,
      customerName: updatedEntry.customerName,
      barberId: barber.id,
      barberName: barber.name,
    });
    broadcastEvent('queue:called', { entry: updatedEntry });
    broadcastEvent('queue:updated', { reason: 'CUSTOMER_CALLED', entryId: updatedEntry.id });
    broadcastEvent('barber:updated', { barberId: barber.id, availability: BARBER_AVAILABILITY.BUSY });
    broadcastEvent('barbers:updated', {});

    return updatedEntry;
  });
}

/**
 * Barber starts customer service (CALLED -> IN_CHAIR)
 */
export async function startService(db, entryId, barberId) {
  return queueMutex.run(async () => {
    const eId = Number(entryId);
    const entryRes = await db.execute({
      sql: 'SELECT * FROM queue_entries WHERE id = ?',
      args: [eId],
    });

    if (entryRes.rows.length === 0) {
      throw new QueueError('Queue entry not found.', { status: 404, code: 'ENTRY_NOT_FOUND' });
    }

    const entry = entryRes.rows[0];
    if (entry.status !== QUEUE_STATUS.CALLED) {
      throw new QueueError(`Cannot start service for an entry in ${entry.status} state.`, {
        status: 409,
        code: 'INVALID_STATE_TRANSITION',
      });
    }

    if (barberId && Number(entry.assigned_barber_id) !== Number(barberId)) {
      throw new QueueError('This entry is not assigned to the specified barber.', {
        status: 403,
        code: 'BARBER_MISMATCH',
      });
    }

    const startedAt = new Date().toISOString();
    await db.execute({
      sql: `UPDATE queue_entries
            SET status = 'IN_CHAIR', service_started_at = ?
            WHERE id = ?`,
      args: [startedAt, eId],
    });

    const updatedEntry = await getQueueEntryById(db, eId);

    broadcastEvent('queue:started', { entry: updatedEntry });
    broadcastEvent('queue:updated', { reason: 'SERVICE_STARTED', entryId: eId });

    return updatedEntry;
  });
}

/**
 * Barber completes customer service (IN_CHAIR -> DONE)
 */
export async function completeService(db, entryId, barberId) {
  return queueMutex.run(async () => {
    const eId = Number(entryId);
    const entryRes = await db.execute({
      sql: 'SELECT * FROM queue_entries WHERE id = ?',
      args: [eId],
    });

    if (entryRes.rows.length === 0) {
      throw new QueueError('Queue entry not found.', { status: 404, code: 'ENTRY_NOT_FOUND' });
    }

    const entry = entryRes.rows[0];
    if (entry.status !== QUEUE_STATUS.IN_CHAIR && entry.status !== QUEUE_STATUS.CALLED) {
      throw new QueueError(`Cannot complete an entry in ${entry.status} state.`, {
        status: 409,
        code: 'INVALID_STATE_TRANSITION',
      });
    }

    const assignedBarberId = entry.assigned_barber_id;
    const completedAt = new Date().toISOString();

    await db.execute({
      sql: `UPDATE queue_entries
            SET status = 'DONE', completed_at = ?
            WHERE id = ?`,
      args: [completedAt, eId],
    });

    if (assignedBarberId) {
      await db.execute({
        sql: `UPDATE barbers
              SET availability = ?, updated_at = ?
              WHERE id = ?`,
        args: [BARBER_AVAILABILITY.AVAILABLE, completedAt, assignedBarberId],
      });
    }

    const updatedEntry = await getQueueEntryById(db, eId);

    broadcastEvent('queue:completed', { entry: updatedEntry });
    broadcastEvent('queue:updated', { reason: 'SERVICE_COMPLETED', entryId: eId });
    if (assignedBarberId) {
      broadcastEvent('barber:updated', {
        barberId: assignedBarberId,
        availability: BARBER_AVAILABILITY.AVAILABLE,
      });
      broadcastEvent('barbers:updated', {});
    }

    return updatedEntry;
  });
}

/**
 * Reception marks customer No-Show (10-minute grace period rule)
 */
export async function markNoShow(db, entryId) {
  return queueMutex.run(async () => {
    const eId = Number(entryId);
    const entryRes = await db.execute({
      sql: 'SELECT * FROM queue_entries WHERE id = ?',
      args: [eId],
    });

    if (entryRes.rows.length === 0) {
      throw new QueueError('Queue entry not found.', { status: 404, code: 'ENTRY_NOT_FOUND' });
    }

    const entry = entryRes.rows[0];
    if (entry.status !== QUEUE_STATUS.CALLED) {
      throw new QueueError('Only CALLED entries can be marked as No-Show.', {
        status: 409,
        code: 'INVALID_STATE_TRANSITION',
      });
    }

    if (!entry.called_at) {
      throw new QueueError('Entry missing called timestamp.', {
        status: 409,
        code: 'MISSING_CALLED_TIMESTAMP',
      });
    }

    const calledAtTime = new Date(entry.called_at).getTime();
    const elapsedMinutes = (Date.now() - calledAtTime) / 60000;
    const graceMinutes = env.noShowGraceMinutes;

    if (elapsedMinutes < graceMinutes) {
      const remainingSeconds = Math.ceil((graceMinutes * 60 * 1000 - (Date.now() - calledAtTime)) / 1000);
      throw new QueueError(
        `Cannot mark No-Show until the 10-minute grace period has elapsed (${remainingSeconds} seconds left).`,
        {
          status: 409,
          code: 'NO_SHOW_GRACE_ACTIVE',
          details: { remainingSeconds },
        }
      );
    }

    const completedAt = new Date().toISOString();
    const assignedBarberId = entry.assigned_barber_id;

    await db.execute({
      sql: `UPDATE queue_entries
            SET status = 'NO_SHOW', completed_at = ?
            WHERE id = ?`,
      args: [completedAt, eId],
    });

    if (assignedBarberId) {
      await db.execute({
        sql: `UPDATE barbers
              SET availability = ?, updated_at = ?
              WHERE id = ?`,
        args: [BARBER_AVAILABILITY.AVAILABLE, completedAt, assignedBarberId],
      });
    }

    const updatedEntry = await getQueueEntryById(db, eId);

    broadcastEvent('queue:no-show', { entry: updatedEntry });
    broadcastEvent('queue:updated', { reason: 'NO_SHOW', entryId: eId });
    if (assignedBarberId) {
      broadcastEvent('barber:updated', {
        barberId: assignedBarberId,
        availability: BARBER_AVAILABILITY.AVAILABLE,
      });
      broadcastEvent('barbers:updated', {});
    }

    return updatedEntry;
  });
}

/**
 * Customer or Reception cancels queue entry
 */
export async function cancelQueueEntry(db, entryId, { reason = 'CUSTOMER_CANCELLED' } = {}) {
  return queueMutex.run(async () => {
    const eId = Number(entryId);
    const entryRes = await db.execute({
      sql: 'SELECT * FROM queue_entries WHERE id = ?',
      args: [eId],
    });

    if (entryRes.rows.length === 0) {
      throw new QueueError('Queue entry not found.', { status: 404, code: 'ENTRY_NOT_FOUND' });
    }

    const entry = entryRes.rows[0];
    if (entry.status !== QUEUE_STATUS.WAITING && entry.status !== QUEUE_STATUS.CALLED) {
      throw new QueueError(
        `Cannot cancel an entry in ${entry.status} state. Service is already in chair or finalized.`,
        {
          status: 409,
          code: 'CANNOT_CANCEL',
        }
      );
    }

    const completedAt = new Date().toISOString();
    const assignedBarberId = entry.assigned_barber_id;

    await db.execute({
      sql: `UPDATE queue_entries
            SET status = 'CANCELLED', completed_at = ?
            WHERE id = ?`,
      args: [completedAt, eId],
    });

    if (entry.status === QUEUE_STATUS.CALLED && assignedBarberId) {
      await db.execute({
        sql: `UPDATE barbers
              SET availability = ?, updated_at = ?
              WHERE id = ?`,
        args: [BARBER_AVAILABILITY.AVAILABLE, completedAt, assignedBarberId],
      });
    }

    const updatedEntry = await getQueueEntryById(db, eId);

    broadcastEvent('queue:cancelled', { entry: updatedEntry, reason });
    broadcastEvent('queue:updated', { reason: 'ENTRY_CANCELLED', entryId: eId });
    if (entry.status === QUEUE_STATUS.CALLED && assignedBarberId) {
      broadcastEvent('barber:updated', {
        barberId: assignedBarberId,
        availability: BARBER_AVAILABILITY.AVAILABLE,
      });
      broadcastEvent('barbers:updated', {});
    }

    return updatedEntry;
  });
}

/**
 * Update Barber Availability (Available, On Break, Off Duty)
 */
export async function updateBarberAvailability(db, barberId, availability) {
  return queueMutex.run(async () => {
    const bId = Number(barberId);
    if (!Object.values(BARBER_AVAILABILITY).includes(availability)) {
      throw new QueueError('Invalid availability value.', {
        status: 400,
        code: 'INVALID_AVAILABILITY',
      });
    }

    const barberRes = await db.execute({
      sql: 'SELECT * FROM barbers WHERE id = ?',
      args: [bId],
    });
    if (barberRes.rows.length === 0) {
      throw new QueueError('Barber not found.', { status: 404, code: 'BARBER_NOT_FOUND' });
    }

    const barber = barberRes.rows[0];

    // If barber is going ON_BREAK or OFF_DUTY, verify they have no active CALLED or IN_CHAIR customer
    if (
      availability === BARBER_AVAILABILITY.ON_BREAK ||
      availability === BARBER_AVAILABILITY.OFF_DUTY
    ) {
      const activeCheck = await db.execute({
        sql: `SELECT id, token_number, status FROM queue_entries
              WHERE assigned_barber_id = ? AND status IN ('CALLED', 'IN_CHAIR')
              LIMIT 1`,
        args: [bId],
      });

      if (activeCheck.rows.length > 0) {
        throw new QueueError(
          `Cannot change availability while serving active customer (${activeCheck.rows[0].token_number}).`,
          {
            status: 409,
            code: 'BARBER_HAS_ACTIVE_CUSTOMER',
          }
        );
      }
    }

    const updatedAt = new Date().toISOString();
    await db.execute({
      sql: 'UPDATE barbers SET availability = ?, updated_at = ? WHERE id = ?',
      args: [availability, updatedAt, bId],
    });

    const updatedRes = await db.execute({
      sql: 'SELECT * FROM barbers WHERE id = ?',
      args: [bId],
    });
    const updatedBarber = updatedRes.rows[0];

    broadcastEvent('barber:updated', {
      barberId: bId,
      availability: updatedBarber.availability,
    });
    broadcastEvent('barbers:updated', {});

    return {
      id: Number(updatedBarber.id),
      name: updatedBarber.name,
      slug: updatedBarber.slug,
      availability: updatedBarber.availability,
      isOnDuty: Boolean(updatedBarber.is_on_duty),
    };
  });
}
