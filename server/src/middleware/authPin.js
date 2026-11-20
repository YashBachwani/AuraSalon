import { env } from '../config/env.js';

export function verifyPinForRole(pin, role = 'staff') {
  const normalized = String(pin || '').trim();
  if (!normalized) return false;

  if (role === 'owner') {
    return normalized === String(env.ownerPin);
  }

  return normalized === String(env.staffPin) || normalized === String(env.ownerPin);
}

export function requirePin(role = 'staff') {
  return (req, res, next) => {
    const providedPin = req.headers['x-staff-pin'];
    if (!verifyPinForRole(providedPin, role)) {
      return res.status(401).json({
        error: 'INVALID_PIN',
        message: role === 'owner' ? 'Valid Owner PIN is required' : 'Valid Staff PIN is required',
      });
    }
    return next();
  };
}
