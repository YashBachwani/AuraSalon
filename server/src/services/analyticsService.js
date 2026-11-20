/**
 * Owner Analytics & Statistics Service
 * Computes authoritative, database-backed statistics for the Salon Owner Dashboard.
 */

import { env } from '../config/env.js';
import { getSalonCurrentTime } from './queueEngine.js';

/**
 * Format a date object as YYYY-MM-DD
 */
function formatDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get date N days ago as YYYY-MM-DD in salon timezone
 */
function getDateNDaysAgo(days = 7, timezone = env.salonTimezone || 'Asia/Kolkata') {
  const now = new Date();
  const past = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(past);
}

/**
 * Fetch complete owner analytics
 * @param {import('@libsql/client').Client} db
 * @param {object} options
 * @param {'today' | '7d' | '30d' | 'all'} [options.range='today']
 */
export async function getOwnerAnalytics(db, { range = 'today' } = {}) {
  const { dateString, now, timeString } = getSalonCurrentTime(env.salonTimezone || 'Asia/Kolkata');

  const date7dAgo = getDateNDaysAgo(7);
  const date30dAgo = getDateNDaysAgo(30);

  // 1. Today's Overview (counts by status for current business date)
  const todayEntriesRes = await db.execute({
    sql: `SELECT id, status, total_price_inr, total_duration_minutes,
                 created_at, called_at, service_started_at, completed_at,
                 preferred_barber_id, assigned_barber_id, services_snapshot_json
          FROM queue_entries
          WHERE business_date = ?`,
    args: [dateString],
  });

  const todayRows = todayEntriesRes.rows;

  let waitingCount = 0;
  let calledCount = 0;
  let servingCount = 0;
  let completedCount = 0;
  let noShowCount = 0;
  let cancelledCount = 0;
  let todayRevenue = 0;

  let totalWaitDurationMs = 0;
  let waitCountWithTimestamps = 0;

  let totalServiceDurationMs = 0;
  let serviceCountWithTimestamps = 0;

  for (const r of todayRows) {
    const status = String(r.status);
    if (status === 'WAITING') waitingCount++;
    else if (status === 'CALLED') calledCount++;
    else if (status === 'IN_CHAIR') servingCount++;
    else if (status === 'DONE') {
      completedCount++;
      todayRevenue += Number(r.total_price_inr || 0);

      // Duration from service_started_at to completed_at
      if (r.service_started_at && r.completed_at) {
        const startMs = new Date(r.service_started_at).getTime();
        const doneMs = new Date(r.completed_at).getTime();
        if (doneMs >= startMs) {
          totalServiceDurationMs += (doneMs - startMs);
          serviceCountWithTimestamps++;
        }
      }
    } else if (status === 'NO_SHOW') noShowCount++;
    else if (status === 'CANCELLED') cancelledCount++;

    // Wait time: from created_at to called_at
    if (r.called_at && r.created_at) {
      const createdMs = new Date(r.created_at).getTime();
      const calledMs = new Date(r.called_at).getTime();
      if (calledMs >= createdMs) {
        totalWaitDurationMs += (calledMs - createdMs);
        waitCountWithTimestamps++;
      }
    }
  }

  const totalCustomersToday = todayRows.length;

  // 2. Revenue Overview (Strictly from DONE completed services)
  const [rev7dRes, rev30dRes, revAllRes, allTimeCustomersRes] = await Promise.all([
    db.execute({
      sql: `SELECT COALESCE(SUM(total_price_inr), 0) AS rev
            FROM queue_entries
            WHERE business_date >= ? AND status = 'DONE'`,
      args: [date7dAgo],
    }),
    db.execute({
      sql: `SELECT COALESCE(SUM(total_price_inr), 0) AS rev
            FROM queue_entries
            WHERE business_date >= ? AND status = 'DONE'`,
      args: [date30dAgo],
    }),
    db.execute({
      sql: `SELECT COALESCE(SUM(total_price_inr), 0) AS rev,
                   COUNT(*) AS completed_count
            FROM queue_entries
            WHERE status = 'DONE'`,
    }),
    db.execute({
      sql: `SELECT COUNT(DISTINCT phone) AS unique_customers,
                   COUNT(*) AS total_all_time_entries
            FROM queue_entries`,
    }),
  ]);

  const weeklyRevenue = Number(rev7dRes.rows[0]?.rev || 0);
  const monthlyRevenue = Number(rev30dRes.rows[0]?.rev || 0);
  const totalCompletedRevenue = Number(revAllRes.rows[0]?.rev || 0);
  const allTimeCompletedCount = Number(revAllRes.rows[0]?.completed_count || 0);
  const uniqueCustomerCount = Number(allTimeCustomersRes.rows[0]?.unique_customers || 0);
  const allTimeEntriesCount = Number(allTimeCustomersRes.rows[0]?.total_all_time_entries || 0);

  // 3. Queue Analytics Calculations
  const avgWaitMinutes = waitCountWithTimestamps > 0
    ? Math.round(totalWaitDurationMs / waitCountWithTimestamps / 60000)
    : null;

  const avgServiceDurationMinutes = serviceCountWithTimestamps > 0
    ? Math.round(totalServiceDurationMs / serviceCountWithTimestamps / 60000)
    : (completedCount > 0
        ? Math.round(todayRows.filter((r) => r.status === 'DONE').reduce((acc, curr) => acc + Number(curr.total_duration_minutes || 0), 0) / completedCount)
        : null);

  const finalizedTotal = completedCount + noShowCount + cancelledCount;
  const completionRate = finalizedTotal > 0
    ? Math.round((completedCount / finalizedTotal) * 100)
    : null;

  // 4. Barber Performance
  const barbersRes = await db.execute(
    'SELECT id, name, slug, specialty, avatar_color, availability, is_on_duty FROM barbers ORDER BY id ASC'
  );

  const barberStats = barbersRes.rows.map((b) => {
    const bId = Number(b.id);
    let barberCompletedToday = 0;
    let barberServing = 0;
    let barberWaiting = 0;
    let barberRevenueToday = 0;

    for (const r of todayRows) {
      const assigned = r.assigned_barber_id ? Number(r.assigned_barber_id) : null;
      const preferred = r.preferred_barber_id ? Number(r.preferred_barber_id) : null;
      const st = String(r.status);

      if (assigned === bId) {
        if (st === 'DONE') {
          barberCompletedToday++;
          barberRevenueToday += Number(r.total_price_inr || 0);
        } else if (st === 'IN_CHAIR') {
          barberServing++;
        }
      }

      // Waiting: either assigned to this barber or preferred with no assignment yet
      if (st === 'WAITING' && (assigned === bId || (preferred === bId && !assigned))) {
        barberWaiting++;
      }
    }

    return {
      barberId: bId,
      name: b.name,
      slug: b.slug,
      specialty: b.specialty,
      avatarColor: b.avatar_color,
      availability: b.availability,
      isOnDuty: Boolean(b.is_on_duty),
      customersCompletedToday: barberCompletedToday,
      customersCurrentlyServing: barberServing,
      customersWaiting: barberWaiting,
      revenueTodayInr: barberRevenueToday,
    };
  });

  // 5. Service Popularity & Analytics
  // Determine date boundary based on range parameter
  let serviceFilterSql = 'WHERE business_date = ?';
  let serviceFilterArgs = [dateString];
  if (range === '7d') {
    serviceFilterSql = 'WHERE business_date >= ?';
    serviceFilterArgs = [date7dAgo];
  } else if (range === '30d') {
    serviceFilterSql = 'WHERE business_date >= ?';
    serviceFilterArgs = [date30dAgo];
  } else if (range === 'all') {
    serviceFilterSql = '';
    serviceFilterArgs = [];
  }

  const rangeEntriesRes = await db.execute({
    sql: `SELECT id, status, total_price_inr, services_snapshot_json
          FROM queue_entries
          ${serviceFilterSql}`,
    args: serviceFilterArgs,
  });

  const serviceCountMap = new Map();
  const serviceRevenueMap = new Map();

  for (const row of rangeEntriesRes.rows) {
    let svcs = [];
    try {
      svcs = JSON.parse(row.services_snapshot_json || '[]');
    } catch {
      svcs = [];
    }

    const isDone = row.status === 'DONE';

    for (const s of svcs) {
      const sId = Number(s.id);
      const nameEn = s.nameEn || s.name_en || 'Service';
      const nameGu = s.nameGu || s.name_gu || nameEn;
      const price = Number(s.priceInr || s.price_inr || 0);

      const existingCount = serviceCountMap.get(sId) || { id: sId, nameEn, nameGu, count: 0 };
      existingCount.count += 1;
      serviceCountMap.set(sId, existingCount);

      if (isDone) {
        const existingRev = serviceRevenueMap.get(sId) || { id: sId, nameEn, nameGu, revenue: 0 };
        existingRev.revenue += price;
        serviceRevenueMap.set(sId, existingRev);
      }
    }
  }

  // Combine counts and revenue
  const allServicesRes = await db.execute('SELECT id, name_en, name_gu, price_inr, duration_minutes FROM services ORDER BY id ASC');
  const serviceStats = allServicesRes.rows.map((svc) => {
    const sId = Number(svc.id);
    const countInfo = serviceCountMap.get(sId);
    const revInfo = serviceRevenueMap.get(sId);
    return {
      id: sId,
      nameEn: svc.name_en,
      nameGu: svc.name_gu,
      priceInr: Number(svc.price_inr),
      durationMinutes: Number(svc.duration_minutes),
      selectedCount: countInfo?.count || 0,
      completedRevenueInr: revInfo?.revenue || 0,
    };
  }).sort((a, b) => b.selectedCount - a.selectedCount);

  const mostPopularService = serviceStats.length > 0 && serviceStats[0].selectedCount > 0
    ? serviceStats[0]
    : null;

  // 6. Recent Queue Activity Log (10 most recent entries today)
  const recentRes = await db.execute({
    sql: `SELECT q.id, q.token_number, q.customer_name, q.phone, q.status, q.source,
                 q.total_price_inr, q.total_duration_minutes, q.services_snapshot_json,
                 q.created_at, q.called_at, q.service_started_at, q.completed_at,
                 b.name as assigned_barber_name
          FROM queue_entries q
          LEFT JOIN barbers b ON q.assigned_barber_id = b.id
          WHERE q.business_date = ?
          ORDER BY q.id DESC
          LIMIT 10`,
    args: [dateString],
  });

  const recentActivity = recentRes.rows.map((r) => {
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
      phone: r.phone,
      status: r.status,
      source: r.source,
      totalPriceInr: Number(r.total_price_inr),
      totalDurationMinutes: Number(r.total_duration_minutes),
      services,
      assignedBarberName: r.assigned_barber_name || null,
      createdAt: r.created_at,
      calledAt: r.called_at,
      serviceStartedAt: r.service_started_at,
      completedAt: r.completed_at,
    };
  });

  // 7. Last 7 Days Daily Registrations & Revenue Trend
  const trendRes = await db.execute({
    sql: `SELECT business_date,
                 COUNT(*) AS total_registrations,
                 SUM(CASE WHEN status = 'DONE' THEN total_price_inr ELSE 0 END) AS completed_revenue,
                 SUM(CASE WHEN status = 'DONE' THEN 1 ELSE 0 END) AS completed_count
          FROM queue_entries
          WHERE business_date >= ?
          GROUP BY business_date
          ORDER BY business_date ASC`,
    args: [date7dAgo],
  });

  const dailyTrend = trendRes.rows.map((row) => ({
    date: row.business_date,
    totalRegistrations: Number(row.total_registrations || 0),
    completedRevenue: Number(row.completed_revenue || 0),
    completedCount: Number(row.completed_count || 0),
  }));

  return {
    businessDate: dateString,
    currentTime: timeString,
    timezone: env.salonTimezone || 'Asia/Kolkata',
    selectedRange: range,

    // A. Today's Overview
    todayOverview: {
      totalCustomersToday,
      waitingCount,
      calledCount,
      servingCount, // IN_CHAIR
      completedCount,
      noShowCount,
      cancelledCount,
      totalAllTimeCustomers: uniqueCustomerCount,
      totalAllTimeEntries: allTimeEntriesCount,
    },

    // B. Revenue Overview (Estimated Service Revenue from DONE entries)
    revenueOverview: {
      todayRevenue,
      weeklyRevenue,
      monthlyRevenue,
      totalCompletedRevenue,
      allTimeCompletedCount,
      estimatedCompletedRevenue: true,
      currency: 'INR',
    },

    // C. Queue Analytics
    queueAnalytics: {
      avgWaitMinutes,
      avgServiceDurationMinutes,
      completionRate,
      totalCustomersToday,
    },

    // D. Barber Performance
    barberPerformance: barberStats,

    // E. Service Analytics
    serviceAnalytics: {
      services: serviceStats,
      mostPopularService,
      totalUniqueServices: serviceStats.length,
    },

    // F. Recent Activity Log
    recentActivity,

    // G. 7-Day Trend
    dailyTrend,
  };
}
