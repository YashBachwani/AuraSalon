/**
 * Wait Time & Queue Position Calculator
 * Implements Section 4 of docs/03-flows-rules.md:
 * - Any Barber formula
 * - Specific Barber formula
 * - Dynamic queue position
 * - Almost-next indicator
 */

export function calculateWaitTimesAndPositions({
  entries = [],
  barbers = [],
  currentTime = new Date(),
}) {
  const workingBarbers = barbers.filter(
    (b) => Boolean(b.isOnDuty) && b.availability !== 'ON_BREAK' && b.availability !== 'OFF_DUTY'
  );
  const workingBarbersCount = Math.max(1, workingBarbers.length);

  // Active chairs (CALLED or IN_CHAIR)
  const barberChairRemaining = {};
  for (const b of barbers) {
    barberChairRemaining[b.id] = 0;
  }

  const activeEntries = entries.filter(
    (e) => e.status === 'CALLED' || e.status === 'IN_CHAIR'
  );

  for (const entry of activeEntries) {
    const barberId = entry.assignedBarberId;
    if (!barberId) continue;
    let remaining = Number(entry.totalDurationMinutes || 0);
    if (entry.status === 'IN_CHAIR' && entry.serviceStartedAt) {
      const elapsed = Math.max(
        0,
        Math.floor((currentTime.getTime() - new Date(entry.serviceStartedAt).getTime()) / 60000)
      );
      remaining = Math.max(5, remaining - elapsed);
    }
    barberChairRemaining[barberId] = remaining;
  }

  const totalRemainingActiveMinutes = Object.values(barberChairRemaining).reduce(
    (sum, m) => sum + m,
    0
  );

  // Sort WAITING entries strictly by createdAt ASC, id ASC (FCFS)
  const waitingEntries = entries
    .filter((e) => e.status === 'WAITING')
    .sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      if (timeA !== timeB) return timeA - timeB;
      return Number(a.id) - Number(b.id);
    });

  const waitingEntriesMap = new Map();
  let waitingMinutesAheadCumulative = 0;
  let anyBarberAheadMinutesCumulative = 0;
  const specificAheadMinutesByBarber = {};
  for (const b of barbers) {
    specificAheadMinutesByBarber[b.id] = 0;
  }

  const hasAvailableWorkingBarber = workingBarbers.some((b) => b.availability === 'AVAILABLE');

  for (let i = 0; i < waitingEntries.length; i++) {
    const entry = waitingEntries[i];
    const isSpecific = Boolean(entry.preferredBarberId);
    let approxWaitMinutes = 0;
    let queuePosition = 1;

    if (!isSpecific) {
      if (i === 0 && hasAvailableWorkingBarber) {
        approxWaitMinutes = 0;
      } else {
        approxWaitMinutes = Math.ceil(
          (totalRemainingActiveMinutes + waitingMinutesAheadCumulative) / workingBarbersCount
        );
      }
      queuePosition = i + 1;
    } else {
      const bId = entry.preferredBarberId;
      const chairRemaining = barberChairRemaining[bId] || 0;
      const specificAhead = specificAheadMinutesByBarber[bId] || 0;
      const anyBarberShare = anyBarberAheadMinutesCumulative / workingBarbersCount;

      approxWaitMinutes = Math.ceil(chairRemaining + specificAhead + anyBarberShare);

      let specificPos = 1;
      for (let j = 0; j < i; j++) {
        const prev = waitingEntries[j];
        if (prev.preferredBarberId === bId || !prev.preferredBarberId) {
          specificPos++;
        }
      }
      queuePosition = specificPos;
    }

    waitingMinutesAheadCumulative += Number(entry.totalDurationMinutes || 0);
    if (isSpecific) {
      const bId = entry.preferredBarberId;
      specificAheadMinutesByBarber[bId] =
        (specificAheadMinutesByBarber[bId] || 0) + Number(entry.totalDurationMinutes || 0);
    } else {
      anyBarberAheadMinutesCumulative += Number(entry.totalDurationMinutes || 0);
    }

    waitingEntriesMap.set(entry.id, {
      queuePosition,
      approxWaitMinutes,
      isAlmostNext: queuePosition <= 2,
    });
  }

  return {
    workingBarbersCount,
    totalRemainingActiveMinutes,
    barberChairRemaining,
    waitingEntriesMap,
  };
}

