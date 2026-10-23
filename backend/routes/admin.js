import { Router } from 'express';
import { getDbPool } from '../config/db.js';
import { requireAuth, requireRole } from '../middleware/requireAuth.js';

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const STATUSES = ['reported', 'assigned', 'in_progress', 'resolved', 'closed'];
const MAX_ISSUE_ID = 18446744073709551615n;
const ESCALATION_HOURS = 48;

function validIssueId(value) {
  if (typeof value !== 'string' || !/^[1-9]\d{0,19}$/.test(value)) return false;
  return BigInt(value) <= MAX_ISSUE_ID;
}

function validStatusTransition(from, to) {
  const transitions = {
    reported: ['assigned', 'in_progress', 'closed'],
    assigned: ['in_progress', 'closed'],
    in_progress: ['assigned', 'closed'],
    resolved: ['closed'],
    closed: [],
  };

  return transitions[from]?.includes(to) ?? false;
}

function createAdminRouter({
  poolProvider = getDbPool,
  frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:5173',
} = {}) {
  const router = Router();

  router.use(requireAuth, requireRole('admin'));

  router.use((req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

    if (req.get('origin') !== frontendOrigin) {
      return res.status(403).json({ error: 'Request origin is not allowed' });
    }
    return next();
  });

  async function updateIssue(req, res, change) {
    const issueId = req.params.id;
    if (!validIssueId(issueId)) {
      return res.status(400).json({ error: 'Invalid issue ID' });
    }

    let connection;
    let transactionStarted = false;
    try {
      connection = await poolProvider().getConnection();
      await connection.beginTransaction();
      transactionStarted = true;

      const [rows] = await connection.execute(
        `SELECT id, status, priority
         FROM issues
         WHERE id = ?
         FOR UPDATE`,
        [issueId],
      );
      const current = rows[0];
      if (!current) {
        await connection.rollback();
        transactionStarted = false;
        return res.status(404).json({ error: 'Issue not found' });
      }

      const result = await change(connection, current, req.session.user.id);
      await connection.commit();
      transactionStarted = false;
      return res.json({ issue: result });
    } catch (error) {
      if (transactionStarted) {
        try {
          await connection.rollback();
        } catch (rollbackError) {
          console.error('Admin issue update rollback failed:', rollbackError.message);
        }
      }
      if (error.statusCode === 409) {
        return res.status(409).json({ error: error.message });
      }
      console.error('Admin issue update failed:', error.message);
      return res.status(500).json({ error: 'Unable to update issue' });
    } finally {
      connection?.release();
    }
  }

  router.patch('/issues/:id/priority', async (req, res) => {
    if (!validIssueId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid issue ID' });
    }
    const { priority } = req.body || {};
    if (!PRIORITIES.includes(priority)) {
      return res.status(400).json({
        error: `Priority must be one of: ${PRIORITIES.join(', ')}`,
      });
    }

    return updateIssue(req, res, async (connection, current, adminId) => {
      if (current.priority === priority) return current;

      await connection.execute(
        'UPDATE issues SET priority = ? WHERE id = ?',
        [priority, req.params.id],
      );
      await connection.execute(
        `INSERT INTO issue_history
           (issue_id, changed_by, old_status, new_status, note)
         VALUES (?, ?, ?, ?, ?)`,
        [
          req.params.id,
          adminId,
          current.status,
          current.status,
          `Priority changed from ${current.priority} to ${priority}`,
        ],
      );
      return { ...current, priority };
    });
  });

  router.patch('/issues/:id/status', async (req, res) => {
    if (!validIssueId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid issue ID' });
    }
    const { status, note } = req.body || {};
    if (!STATUSES.includes(status)) {
      return res.status(400).json({
        error: `Status must be one of: ${STATUSES.join(', ')}`,
      });
    }
    if (status === 'resolved') {
      return res.status(400).json({
        error: 'Use the resolve endpoint and provide a resolution note',
      });
    }
    if (note !== undefined && (typeof note !== 'string' || note.length > 5000)) {
      return res.status(400).json({ error: 'Status note must be 5000 characters or fewer' });
    }

    return updateIssue(req, res, async (connection, current, adminId) => {
      if (current.status === status) return current;
      if (!validStatusTransition(current.status, status)) {
        const error = new Error(`Cannot change status from ${current.status} to ${status}`);
        error.statusCode = 409;
        throw error;
      }

      await connection.execute(
        'UPDATE issues SET status = ? WHERE id = ?',
        [status, req.params.id],
      );
      await connection.execute(
        `INSERT INTO issue_history
           (issue_id, changed_by, old_status, new_status, note)
         VALUES (?, ?, ?, ?, ?)`,
        [req.params.id, adminId, current.status, status, note?.trim() || null],
      );
      return { ...current, status };
    });
  });

  router.post('/issues/:id/resolve', async (req, res) => {
    if (!validIssueId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid issue ID' });
    }
    const note = typeof req.body?.note === 'string' ? req.body.note.trim() : '';
    if (!note || note.length > 5000) {
      return res.status(400).json({
        error: 'A resolution note of 1 to 5000 characters is required',
      });
    }

    return updateIssue(req, res, async (connection, current, adminId) => {
      if (!['reported', 'assigned', 'in_progress'].includes(current.status)) {
        const error = new Error(`Cannot resolve an issue with status ${current.status}`);
        error.statusCode = 409;
        throw error;
      }

      await connection.execute(
        "UPDATE issues SET status = 'resolved' WHERE id = ?",
        [req.params.id],
      );
      await connection.execute(
        `INSERT INTO issue_history
           (issue_id, changed_by, old_status, new_status, note)
         VALUES (?, ?, ?, 'resolved', ?)`,
        [req.params.id, adminId, current.status, note],
      );
      return { ...current, status: 'resolved' };
    });
  });

  router.get('/analytics', async (_req, res) => {
    try {
      const pool = poolProvider();
      const [statusRows] = await pool.execute(
        'SELECT status, COUNT(*) AS count FROM issues GROUP BY status',
      );
      const [priorityRows] = await pool.execute(
        'SELECT priority, COUNT(*) AS count FROM issues GROUP BY priority',
      );
      const [categoryRows] = await pool.execute(
        `SELECT category, COUNT(*) AS count
         FROM issues
         GROUP BY category
         ORDER BY count DESC, category ASC`,
      );
      const [totalRows] = await pool.execute(
        `SELECT COUNT(*) AS total,
                SUM(status IN ('resolved', 'closed')) AS resolved
         FROM issues`,
      );

      return res.json({
        total: Number(totalRows[0].total),
        resolved: Number(totalRows[0].resolved || 0),
        byStatus: Object.fromEntries(statusRows.map((row) => [row.status, Number(row.count)])),
        byPriority: Object.fromEntries(priorityRows.map((row) => [row.priority, Number(row.count)])),
        byCategory: categoryRows.map((row) => ({
          category: row.category,
          count: Number(row.count),
        })),
      });
    } catch (error) {
      console.error('Admin analytics failed:', error.message);
      return res.status(500).json({ error: 'Unable to retrieve issue analytics' });
    }
  });

  router.get('/escalations', async (_req, res) => {
    try {
      const cutoff = new Date(Date.now() - ESCALATION_HOURS * 60 * 60 * 1000);
      const [issues] = await poolProvider().execute(
        `SELECT i.id, i.title, i.description, i.category, i.location,
                u.full_name AS reporter_name, i.priority, i.status,
                i.assigned_to, i.created_at
         FROM issues i
         JOIN users u ON u.id = i.reporter_id
         WHERE i.priority IN ('high', 'urgent')
           AND i.status NOT IN ('resolved', 'closed')
           AND i.created_at <= ?
         ORDER BY i.priority = 'urgent' DESC, i.created_at ASC`,
        [cutoff],
      );
      return res.json({ thresholdHours: ESCALATION_HOURS, issues });
    } catch (error) {
      console.error('Admin escalation list failed:', error.message);
      return res.status(500).json({ error: 'Unable to retrieve escalated issues' });
    }
  });

  return router;
}

export { createAdminRouter };
export default createAdminRouter();
