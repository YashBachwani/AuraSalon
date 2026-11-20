export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/+$/, '');

const TOKEN_KEY = 'aura_auth_token';

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

export function setStoredToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {}
}

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'NETWORK_ERROR', details = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function apiRequest(path, options = {}) {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs || 10000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new ApiError(data.message || `Request failed (${response.status})`, {
        status: response.status,
        code: data.error || 'REQUEST_FAILED',
        details: data.details || data,
      });
    }

    return data;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err.name === 'AbortError') {
      throw new ApiError('Request timed out. Please try again.', { code: 'TIMEOUT' });
    }
    throw new ApiError('Unable to connect to the salon server.', { code: 'NETWORK_ERROR' });
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  getHealth: () => apiRequest('/api/health'),
  getBootstrap: () => apiRequest('/api/bootstrap'),
  verifyPin: (pin, role = 'staff') =>
    apiRequest('/api/auth/verify-pin', {
      method: 'POST',
      body: { pin, role },
    }),

  // Authentication & Demo Accounts
  login: (credentials) =>
    apiRequest('/api/auth/login', {
      method: 'POST',
      body: credentials,
    }),
  getMe: () => apiRequest('/api/auth/me'),
  logout: () => apiRequest('/api/auth/logout', { method: 'POST' }),
  getDemoCredentials: () => apiRequest('/api/auth/demo-credentials'),
  getCustomerDashboard: (phone) =>
    apiRequest(`/api/auth/customer/dashboard${phone ? `?phone=${phone}` : ''}`),

  // Queue Endpoints
  joinQueue: ({ customerName, phone, serviceIds, preferredBarberId }) =>
    apiRequest('/api/queue/join', {
      method: 'POST',
      body: { customerName, phone, serviceIds, preferredBarberId },
    }),
  addWalkIn: ({ customerName, phone, serviceIds, preferredBarberId }) =>
    apiRequest('/api/queue/walkin', {
      method: 'POST',
      body: { customerName, phone, serviceIds, preferredBarberId },
    }),
  getQueue: ({ includeCompleted = false } = {}) =>
    apiRequest(`/api/queue${includeCompleted ? '?includeCompleted=true' : ''}`),
  getQueueEntry: (id) => apiRequest(`/api/queue/${id}`),
  getBarberQueue: (slugOrId) => apiRequest(`/api/queue/barber/${slugOrId}`),
  getDisplayQueue: () => apiRequest('/api/queue/display'),

  // Staff Queue Operations
  callNext: (barberId) =>
    apiRequest('/api/queue/call-next', {
      method: 'POST',
      body: { barberId },
    }),
  startService: (entryId, barberId) =>
    apiRequest(`/api/queue/${entryId}/start`, {
      method: 'POST',
      body: { barberId },
    }),
  completeService: (entryId, barberId) =>
    apiRequest(`/api/queue/${entryId}/complete`, {
      method: 'POST',
      body: { barberId },
    }),
  markNoShow: (entryId) =>
    apiRequest(`/api/queue/${entryId}/no-show`, {
      method: 'POST',
    }),
  cancelQueueEntry: (entryId, reason) =>
    apiRequest(`/api/queue/${entryId}/cancel`, {
      method: 'POST',
      body: { reason },
    }),
  updateBarberAvailability: (barberId, availability) =>
    apiRequest(`/api/barbers/${barberId}/availability`, {
      method: 'PATCH',
      body: { availability },
    }),

  // Owner Analytics
  getOwnerAnalytics: (range = 'today') =>
    apiRequest(`/api/admin/analytics?range=${range}`),
};
