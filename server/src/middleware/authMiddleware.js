import { verifyToken } from '../services/authService.js';
import { verifyPinForRole } from './authPin.js';

export function authenticateUser(req, _res, next) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const user = verifyToken(token);
    if (user) {
      req.user = user;
      req.token = token;
      return next();
    }
  }

  // Fallback support for legacy x-staff-pin header
  const pinHeader = req.headers['x-staff-pin'];
  if (pinHeader) {
    if (verifyPinForRole(pinHeader, 'owner')) {
      req.user = { role: 'owner', name: 'Salon Owner' };
      return next();
    }
    if (verifyPinForRole(pinHeader, 'staff')) {
      req.user = { role: 'reception', name: 'Reception Staff' };
      return next();
    }
  }

  req.user = null;
  return next();
}

/**
 * Route guard requiring one of the allowed roles
 */
export function requireAuth(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        ok: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required. Please log in.',
      });
    }

    if (allowedRoles.length > 0) {
      const userRole = req.user.role;
      const isAllowed =
        allowedRoles.includes(userRole) ||
        (userRole === 'owner' && allowedRoles.includes('reception'));

      if (!isAllowed) {
        return res.status(403).json({
          ok: false,
          error: 'FORBIDDEN',
          message: 'You do not have permission to access this resource.',
        });
      }
    }

    return next();
  };
}

/**
 * Guard ensuring a barber can only manage their own chair
 */
export function requireBarberSelfOrStaff() {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        ok: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required.',
      });
    }

    if (req.user.role === 'owner' || req.user.role === 'reception') {
      return next();
    }

    if (req.user.role === 'barber') {
      const targetParam = req.params.nameOrId || req.params.slugOrId || req.params.id;
      if (targetParam) {
        const isMatch =
          String(req.user.barberId) === String(targetParam) ||
          String(req.user.barberSlug).toLowerCase() === String(targetParam).toLowerCase();

        if (!isMatch) {
          return res.status(403).json({
            ok: false,
            error: 'FORBIDDEN_BARBER_ACCESS',
            message: 'Barbers can only access and manage their own chair.',
          });
        }
      }
      return next();
    }

    return res.status(403).json({
      ok: false,
      error: 'FORBIDDEN',
      message: 'Access restricted to authorized barber or staff.',
    });
  };
}

