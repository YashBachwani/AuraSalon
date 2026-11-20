/**
 * Centralized Queue Management Engine — Stage 1 Foundation
 *
 * Canonical status enums shared across the backend to keep Barber Availability
 * strictly separated from Queue-Entry Status (per docs/03-flows-rules.md).
 * Full allocation, state-transition, wait-time, and concurrency logic will be
 * implemented incrementally in Stages 2–7.
 */

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
