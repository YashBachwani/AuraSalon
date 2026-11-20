export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/+$/, '');

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

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
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
};
