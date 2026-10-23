
const API_BASE = 'http://localhost:3000/api';

async function request(path, options = {}, expectedStatus) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  if (response.status === 204) return null;

  const data = await response.json().catch(() => ({}));

  if (expectedStatus !== undefined && response.status !== expectedStatus) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }

  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }

  return data;
}

export const api = {
  me: () => request('/auth/me'),

  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (fullName, email, password) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password }),
    }, 201),

  logout: () =>
    request('/auth/logout', { method: 'POST' }),

  listIssues: () => request('/issues'),

  createIssue: (issue) =>
    request('/issues', {
      method: 'POST',
      body: JSON.stringify(issue),
    }),
};
