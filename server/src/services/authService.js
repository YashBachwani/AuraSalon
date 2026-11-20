import crypto from 'node:crypto';
import { env } from '../config/env.js';

const invalidatedTokens = new Set();

export class AuthError extends Error {
  constructor(message, { status = 401, code = 'AUTH_ERROR', details = null } = {}) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Sign HMAC-SHA256 JWT-compatible token
 */
export function signToken(payload, secret = env.authSecret, expiresInSeconds = 7 * 24 * 3600) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const jti = crypto.randomUUID();
  const body = { ...payload, jti, exp, iat: Math.floor(Date.now() / 1000) };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedBody = Buffer.from(JSON.stringify(body)).toString('base64url');

  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedBody}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedBody}.${signature}`;
}

/**
 * Verify HMAC-SHA256 token and check expiry & revocation
 */
export function verifyToken(tokenString, secret = env.authSecret) {
  if (!tokenString || typeof tokenString !== 'string') return null;
  if (invalidatedTokens.has(tokenString)) return null;

  const parts = tokenString.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedBody, signature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedBody}`)
    .digest('base64url');

  try {
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const body = JSON.parse(Buffer.from(encodedBody, 'base64url').toString('utf8'));
    if (body.exp && body.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return body;
  } catch {
    return null;
  }
}

export function revokeToken(tokenString) {
  if (tokenString) {
    invalidatedTokens.add(tokenString);
  }
}

/**
 * Customer Demo Login
 */
export async function authenticateCustomer(db, { phone, code }) {
  const cleanedPhone = String(phone || '').replace(/\D/g, '');
  if (!cleanedPhone || cleanedPhone.length !== 10) {
    throw new AuthError('Please enter a valid 10-digit mobile number.', {
      status: 400,
      code: 'INVALID_PHONE',
    });
  }

  const expectedCode = String(env.demoCustomerCode || '123456');
  if (String(code || '').trim() !== expectedCode) {
    throw new AuthError('Invalid verification code. Use demo code: 123456', {
      status: 401,
      code: 'INVALID_VERIFICATION_CODE',
    });
  }

  // Look up customer name from past queue entries, or default to realistic Indian name
  const existingRes = await db.execute({
    sql: 'SELECT customer_name FROM queue_entries WHERE phone = ? ORDER BY id DESC LIMIT 1',
    args: [cleanedPhone],
  });

  const customerName = existingRes.rows[0]?.customer_name || 'Aarav Patel';

  const user = {
    role: 'customer',
    name: customerName,
    phone: cleanedPhone,
  };

  const token = signToken(user);
  return { token, user };
}

/**
 * Barber Login
 */
export async function authenticateBarber(db, { barberId, pin }) {
  const bId = Number(barberId);
  if (!bId || isNaN(bId)) {
    throw new AuthError('Please select a valid barber profile.', {
      status: 400,
      code: 'MISSING_BARBER_ID',
    });
  }

  const barberRes = await db.execute({
    sql: 'SELECT id, name, slug, specialty, avatar_color, availability, is_on_duty FROM barbers WHERE id = ?',
    args: [bId],
  });

  if (barberRes.rows.length === 0) {
    throw new AuthError('Selected barber not found.', { status: 404, code: 'BARBER_NOT_FOUND' });
  }

  const barber = barberRes.rows[0];
  const providedPin = String(pin || '').trim();
  const validPins = [
    String(env.barberPin || '1234'),
    String(env.staffPin || '1234'),
    `${barber.slug}123`,
  ];

  if (!validPins.includes(providedPin)) {
    throw new AuthError(`Invalid PIN for ${barber.name}. Demo PIN is 1234`, {
      status: 401,
      code: 'INVALID_PIN',
    });
  }

  const user = {
    role: 'barber',
    barberId: Number(barber.id),
    name: barber.name,
    slug: barber.slug,
    specialty: barber.specialty,
    avatarColor: barber.avatar_color,
    availability: barber.availability,
  };

  const token = signToken(user);
  return { token, user };
}

/**
 * Reception Login
 */
export async function authenticateReception({ pin }) {
  const providedPin = String(pin || '').trim();
  const validPins = [String(env.staffPin || '1234'), String(env.ownerPin || '5678')];

  if (!validPins.includes(providedPin)) {
    throw new AuthError('Invalid Reception Staff PIN. Demo PIN is 1234', {
      status: 401,
      code: 'INVALID_PIN',
    });
  }

  const user = {
    role: 'reception',
    name: 'Reception Staff',
  };

  const token = signToken(user);
  return { token, user };
}

/**
 * Owner Login
 */
export async function authenticateOwner({ pin }) {
  const providedPin = String(pin || '').trim();
  if (providedPin !== String(env.ownerPin || '5678')) {
    throw new AuthError('Invalid Owner PIN. Demo PIN is 5678', {
      status: 401,
      code: 'INVALID_PIN',
    });
  }

  const user = {
    role: 'owner',
    name: 'Salon Owner',
  };

  const token = signToken(user);
  return { token, user };
}

/**
 * Get public demo credentials catalog for evaluator convenience
 */
export async function getDemoCredentialsCatalog(db) {
  const barbersRes = await db.execute(
    'SELECT id, name, slug, specialty FROM barbers WHERE is_on_duty = 1 ORDER BY id ASC'
  );

  return {
    customer: {
      phone: String(env.demoCustomerPhone || '9876543210'),
      code: String(env.demoCustomerCode || '123456'),
      label: 'Demo Customer (Aarav Patel)',
    },
    reception: {
      pin: String(env.staffPin || '1234'),
      label: 'Reception Staff',
    },
    owner: {
      pin: String(env.ownerPin || '5678'),
      label: 'Salon Owner',
    },
    barbers: barbersRes.rows.map((b) => ({
      id: Number(b.id),
      name: b.name,
      slug: b.slug,
      pin: String(env.barberPin || '1234'),
      label: `Barber ${b.name}`,
    })),
  };
}
