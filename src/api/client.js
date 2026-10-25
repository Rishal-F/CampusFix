
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

async function request(path, options = {}, expectedStatus) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Cannot connect to CampusFix server. Please check that the backend is running.');
    }
    throw error;
  }

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

  getIssue: (id) => request(`/issues/${encodeURIComponent(id)}`),

  updateIssuePriority: (id, priority) =>
    request(`/admin/issues/${encodeURIComponent(id)}/priority`, {
      method: 'PATCH',
      body: JSON.stringify({ priority }),
    }),

  updateIssueStatus: (id, status, note) =>
    request(`/admin/issues/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, ...(note ? { note } : {}) }),
    }),

  resolveIssue: (id, note) =>
    request(`/admin/issues/${encodeURIComponent(id)}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    }),

  getAdminAnalytics: () => request('/admin/analytics'),

  listEscalations: () => request('/admin/escalations'),

  createIssue: (issue) =>
    request('/issues', {
      method: 'POST',
      body: JSON.stringify(issue),
    }),
};
