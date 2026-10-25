import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import express from 'express';
import { createAdminRouter } from '../routes/admin.js';

let server;
let baseUrl;
let state;
let transaction;

function createPool() {
  return {
    async getConnection() {
      const snapshot = {
        issue: state.issue ? { ...state.issue } : null,
        history: [...state.history],
      };
      return {
        async beginTransaction() {
          transaction.begun = true;
        },
        async commit() {
          transaction.committed = true;
        },
        async rollback() {
          transaction.rolledBack = true;
          state.issue = snapshot.issue;
          state.history = snapshot.history;
        },
        release() {
          transaction.released = true;
        },
        async execute(sql, parameters = []) {
          if (sql.includes('FROM issues') && sql.includes('FOR UPDATE')) {
            const issue = state.issue && String(state.issue.id) === String(parameters[0])
              ? { ...state.issue }
              : null;
            return [issue ? [issue] : []];
          }
          if (sql.includes('AND role =') && sql.includes('FROM users')) {
            const user = state.users.find((item) => String(item.id) === String(parameters[0])
              && item.role === 'admin');
            return [user ? [{ ...user }] : []];
          }
          if (sql.includes('UPDATE issues SET assigned_to = ?')) {
            state.issue.assigned_to = parameters[0];
            return [{ affectedRows: 1 }];
          }
          if (sql.includes('UPDATE issues SET priority = ?')) {
            state.issue.priority = parameters[0];
            return [{ affectedRows: 1 }];
          }
          if (sql.includes("UPDATE issues SET status = 'resolved'")) {
            state.issue.status = 'resolved';
            return [{ affectedRows: 1 }];
          }
          if (sql.includes('UPDATE issues SET status = ?')) {
            state.issue.status = parameters[0];
            return [{ affectedRows: 1 }];
          }
          if (sql.includes('INSERT INTO issue_history')) {
            if (state.failHistory) throw new Error('simulated history insert failure');
            const resolving = sql.includes("'resolved'");
            state.history.push({
              issue_id: parameters[0],
              changed_by: parameters[1],
              old_status: parameters[2],
              new_status: resolving ? 'resolved' : parameters[3],
              note: resolving ? parameters[3] : parameters[4],
            });
            return [{ insertId: state.history.length }];
          }
          throw new Error(`Unexpected transaction query: ${sql}`);
        },
      };
    },
    async execute(sql) {
      if (sql.includes("FROM users") && sql.includes("role = 'admin'")) {
        return [state.users
          .filter((user) => user.role === 'admin')
          .map(({ id, full_name, email }) => ({ id, full_name, email }))];
      }
      if (sql.includes('GROUP BY status')) {
        return [[{ status: 'reported', count: state.issue ? 1 : 0 }]];
      }
      if (sql.includes('GROUP BY priority')) {
        return [[{ priority: state.issue?.priority || 'medium', count: state.issue ? 1 : 0 }]];
      }
      if (sql.includes('GROUP BY category')) {
        return [[{ category: 'Electrical', count: state.issue ? 1 : 0 }]];
      }
      if (sql.includes('SUM(status IN')) {
        return [[{ total: state.issue ? 1 : 0, resolved: state.issue?.status === 'resolved' ? 1 : 0 }]];
      }
      if (sql.includes('FROM issues i') && sql.includes('i.created_at <= ?')) {
        return [[state.issue && state.issue.priority === 'urgent' ? { ...state.issue } : null].filter(Boolean)];
      }
      throw new Error(`Unexpected pool query: ${sql}`);
    },
  };
}

beforeEach(async () => {
  state = {
    issue: {
      id: 7,
      status: 'reported',
      priority: 'medium',
      title: 'Test issue',
      assigned_to: null,
    },
    users: [
      { id: 42, full_name: 'Admin User', email: 'admin@example.test', role: 'admin' },
      { id: 43, full_name: 'Second Admin', email: 'second@example.test', role: 'admin' },
      { id: 17, full_name: 'Student User', email: 'student@example.test', role: 'student' },
    ],
    history: [],
    failHistory: false,
  };
  transaction = { begun: false, committed: false, rolledBack: false, released: false };

  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    const role = req.get('x-test-role');
    if (role) req.session = { user: { id: 42, role } };
    next();
  });
  app.use('/api/admin', createAdminRouter({
    poolProvider: createPool,
    frontendOrigin: 'http://localhost:5173',
  }));
  app.use((error, _req, res, _next) => {
    res.status(500).json({ error: error.message });
  });

  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api/admin`;
});

afterEach(async () => {
  if (server) {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});

async function request(path, { role, method = 'GET', body, origin = 'http://localhost:5173' } = {}) {
  const headers = { Origin: origin };
  if (role) headers['X-Test-Role'] = role;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  return fetch(`${baseUrl}${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

test('priority update commits a parameterized value and records same-status history', async () => {
  const response = await request('/issues/7/priority', {
    role: 'admin',
    method: 'PATCH',
    body: { priority: 'urgent' },
  });
  assert.equal(response.status, 200);
  assert.equal(state.issue.priority, 'urgent');
  assert.deepEqual(state.history[0], {
    issue_id: '7',
    changed_by: 42,
    old_status: 'reported',
    new_status: 'reported',
    note: 'Priority changed from medium to urgent',
  });
  assert.equal(transaction.committed, true);
  assert.equal(transaction.released, true);
});

test('status update enforces forward transitions and records history', async () => {
  const response = await request('/issues/7/status', {
    role: 'admin',
    method: 'PATCH',
    body: { status: 'assigned', note: 'Assigned for review' },
  });
  assert.equal(response.status, 200);
  assert.equal(state.issue.status, 'assigned');
  assert.equal(state.history[0].old_status, 'reported');
  assert.equal(state.history[0].new_status, 'assigned');
  assert.equal(state.history[0].changed_by, 42);

  const invalidTransition = await request('/issues/7/status', {
    role: 'admin',
    method: 'PATCH',
    body: { status: 'reported' },
  });
  assert.equal(invalidTransition.status, 409);
});

test('resolve requires a note and persists the resolution history entry', async () => {
  const missingNote = await request('/issues/7/resolve', {
    role: 'admin',
    method: 'POST',
    body: { note: '   ' },
  });
  assert.equal(missingNote.status, 400);

  const response = await request('/issues/7/resolve', {
    role: 'admin',
    method: 'POST',
    body: { note: 'Replaced the damaged fixture.' },
  });
  assert.equal(response.status, 200);
  assert.equal(state.issue.status, 'resolved');
  assert.equal(state.history[0].note, 'Replaced the damaged fixture.');
  assert.equal(state.history[0].new_status, 'resolved');
});

test('authentication and admin role are enforced', async () => {
  const unauthenticated = await request('/issues/7/priority', {
    method: 'PATCH',
    body: { priority: 'high' },
  });
  assert.equal(unauthenticated.status, 401);

  const student = await request('/issues/7/priority', {
    role: 'student',
    method: 'PATCH',
    body: { priority: 'high' },
  });
  assert.equal(student.status, 403);
});

test('eligible assignee list is restricted to admin users', async () => {
  const response = await request('/assignees', { role: 'admin' });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    assignees: [
      { id: '42', fullName: 'Admin User', email: 'admin@example.test' },
      { id: '43', fullName: 'Second Admin', email: 'second@example.test' },
    ],
  });
});

test('only authenticated admins can access assignees and assign issues', async () => {
  const unauthenticatedList = await request('/assignees');
  assert.equal(unauthenticatedList.status, 401);

  const studentList = await request('/assignees', { role: 'student' });
  assert.equal(studentList.status, 403);

  const unauthenticatedAssignment = await request('/issues/7/assignment', {
    method: 'PATCH',
    body: { assigneeId: '42' },
  });
  assert.equal(unauthenticatedAssignment.status, 401);

  const studentAssignment = await request('/issues/7/assignment', {
    role: 'student',
    method: 'PATCH',
    body: { assigneeId: '42' },
  });
  assert.equal(studentAssignment.status, 403);
});

test('assignment, reassignment, and unassignment use eligible IDs without changing status history', async () => {
  const assigned = await request('/issues/7/assignment', {
    role: 'admin',
    method: 'PATCH',
    body: { assigneeId: '42' },
  });
  const assignedResult = await assigned.json();
  assert.equal(assigned.status, 200, JSON.stringify(assignedResult));
  assert.equal(state.issue.assigned_to, 42);
  assert.equal(state.issue.status, 'reported');
  assert.equal(state.history.length, 0);
  assert.deepEqual(assignedResult.issue.assignedTo, {
    id: '42',
    fullName: 'Admin User',
    email: 'admin@example.test',
  });
  assert.equal(transaction.committed, true);
  assert.equal(transaction.released, true);

  const reassigned = await request('/issues/7/assignment', {
    role: 'admin',
    method: 'PATCH',
    body: { assigneeId: '43' },
  });
  assert.equal(reassigned.status, 200);
  assert.equal(state.issue.assigned_to, 43);

  const unassigned = await request('/issues/7/assignment', {
    role: 'admin',
    method: 'PATCH',
    body: { assigneeId: null },
  });
  assert.equal(unassigned.status, 200);
  assert.equal(state.issue.assigned_to, null);
  assert.equal((await unassigned.json()).issue.assignedTo, null);
  assert.equal(state.issue.status, 'reported');
  assert.equal(state.history.length, 0);
});

test('assignment rejects invalid IDs, student assignees, and missing issues', async () => {
  for (const assigneeId of ['0', '01', '18446744073709551616', 42, 'not-an-id', undefined]) {
    const response = await request('/issues/7/assignment', {
      role: 'admin',
      method: 'PATCH',
      body: { assigneeId },
    });
    assert.equal(response.status, 400);
  }

  const studentAssignee = await request('/issues/7/assignment', {
    role: 'admin',
    method: 'PATCH',
    body: { assigneeId: '17' },
  });
  assert.equal(studentAssignee.status, 400);

  const nonexistentAssignee = await request('/issues/7/assignment', {
    role: 'admin',
    method: 'PATCH',
    body: { assigneeId: '999' },
  });
  assert.equal(nonexistentAssignee.status, 400);

  state.issue = null;
  const missingIssue = await request('/issues/7/assignment', {
    role: 'admin',
    method: 'PATCH',
    body: { assigneeId: '42' },
  });
  assert.equal(missingIssue.status, 404);
  assert.equal(state.history.length, 0);
});

test('invalid input and missing issues are rejected', async () => {
  const invalidPriority = await request('/issues/7/priority', {
    role: 'admin',
    method: 'PATCH',
    body: { priority: 'critical' },
  });
  assert.equal(invalidPriority.status, 400);

  const invalidStatus = await request('/issues/7/status', {
    role: 'admin',
    method: 'PATCH',
    body: { status: 'pending' },
  });
  assert.equal(invalidStatus.status, 400);

  const invalidId = await request('/issues/0/status', {
    role: 'admin',
    method: 'PATCH',
    body: { status: 'assigned' },
  });
  assert.equal(invalidId.status, 400);

  state.issue = null;
  const missingIssue = await request('/issues/7/priority', {
    role: 'admin',
    method: 'PATCH',
    body: { priority: 'high' },
  });
  assert.equal(missingIssue.status, 404);
});

test('history insertion failure rolls back the issue update and releases the connection', async () => {
  state.failHistory = true;
  const response = await request('/issues/7/priority', {
    role: 'admin',
    method: 'PATCH',
    body: { priority: 'high' },
  });
  assert.equal(response.status, 500);
  assert.equal(state.issue.priority, 'medium');
  assert.equal(state.history.length, 0);
  assert.equal(transaction.rolledBack, true);
  assert.equal(transaction.committed, false);
  assert.equal(transaction.released, true);
});

test('analytics and escalations return database-derived summaries', async () => {
  const analyticsResponse = await request('/analytics', { role: 'admin' });
  assert.equal(analyticsResponse.status, 200);
  const analytics = await analyticsResponse.json();
  assert.equal(analytics.total, 1);
  assert.equal(analytics.byStatus.reported, 1);

  const escalationsResponse = await request('/escalations', { role: 'admin' });
  assert.equal(escalationsResponse.status, 200);
  const escalations = await escalationsResponse.json();
  assert.equal(escalations.thresholdHours, 48);
  assert.deepEqual(escalations.issues, []);
});

test('state-changing admin requests reject a foreign origin', async () => {
  const response = await request('/issues/7/priority', {
    role: 'admin',
    method: 'PATCH',
    body: { priority: 'high' },
    origin: 'https://attacker.invalid',
  });
  assert.equal(response.status, 403);
  assert.equal(transaction.begun, false);
});
