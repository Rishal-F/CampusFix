
import { Router } from 'express';
import { getDbPool } from '../config/db.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.use(requireAuth);

const allowedPriorities = ['low', 'medium', 'high', 'urgent'];

function derivePriority(category, title, description) {
  const text = `${title} ${description}`.toLowerCase();
  const urgentElectricalIndicators = /\b(sparking|exposed wire|live wire|smoke|burning smell|electric shock|fire)\b/;
  const seriousImpactIndicators = /\b(dangerous|hazard|injury|blocked exit|flooding|no power|outage)\b/;
  const minorIssueIndicators = /\b(cosmetic damage|paint peeling|minor scratch|cosmetic issue|non-blocking)\b/;

  if (category === 'Electrical' && urgentElectricalIndicators.test(text)) {
    return 'urgent';
  }

  if (seriousImpactIndicators.test(text)) {
    return 'high';
  }

  if (minorIssueIndicators.test(text)) {
    return 'low';
  }

  return 'medium';
}

// List issues: students see their own; admins see all.
router.get('/', async (req, res) => {
  try {
    const pool = getDbPool();
    let rows;

    if (req.session.user.role === 'admin') {
      [rows] = await pool.execute(
        `SELECT i.id, i.reporter_id, i.title, i.description,
                i.category, i.location, i.priority, i.status,
                i.assigned_to, i.image_key, i.created_at, i.updated_at,
                u.full_name AS reporter_name
         FROM issues i
         JOIN users u ON u.id = i.reporter_id
         ORDER BY i.created_at DESC`
      );
    } else {
      [rows] = await pool.execute(
        `SELECT id, reporter_id, title, description, category,
                location, priority, status, assigned_to, image_key,
                created_at, updated_at
         FROM issues
         WHERE reporter_id = ?
         ORDER BY created_at DESC`,
        [req.session.user.id]
      );
    }

    return res.json({ issues: rows });
  } catch (error) {
    console.error('List issues failed:', error.message);
    return res.status(500).json({ error: 'Unable to retrieve issues' });
  }
});

// Submit a student issue.
router.post('/', async (req, res) => {
  if (req.session.user.role !== 'student') {
    return res.status(403).json({
      error: 'Only student accounts can submit issues',
    });
  }

  const title = typeof req.body.title === 'string'
    ? req.body.title.trim()
    : '';
  const description = typeof req.body.description === 'string'
    ? req.body.description.trim()
    : '';
  const category = typeof req.body.category === 'string'
    ? req.body.category.trim()
    : '';
  const location = typeof req.body.location === 'string'
    ? req.body.location.trim()
    : '';

  const allowedCategories = [
    'Electrical',
    'Plumbing',
    'Cleaning',
    'Furniture',
    'Network',
    'Other',
  ];

  if (
    title.length < 4 || title.length > 160 ||
    description.length < 10 || description.length > 5000 ||
    !allowedCategories.includes(category) ||
    location.length < 2 || location.length > 180
  ) {
    return res.status(400).json({
      error: 'Provide a valid title, description, category, and location',
      allowedCategories,
    });
  }

  try {
    const priority = derivePriority(category, title, description);
    if (!allowedPriorities.includes(priority)) {
      return res.status(500).json({ error: 'Unable to determine issue priority' });
    }

    const pool = getDbPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [result] = await connection.execute(
        `INSERT INTO issues
           (reporter_id, title, description, category, location, priority)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          req.session.user.id,
          title,
          description,
          category,
          location,
          priority,
        ]
      );

      await connection.execute(
        `INSERT INTO issue_history
           (issue_id, changed_by, old_status, new_status, note)
         VALUES (?, ?, NULL, 'reported', ?)`,
        [
          result.insertId,
          req.session.user.id,
          'Issue submitted',
        ]
      );

      await connection.commit();

      return res.status(201).json({
        issue: {
          id: result.insertId,
          title,
          description,
          category,
          location,
          priority,
          status: 'reported',
        },
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Create issue failed:', error.message);
    return res.status(500).json({ error: 'Unable to submit issue' });
  }
});

// View one issue, checking ownership for students.
router.get('/:id', async (req, res) => {
  const issueId = req.params.id;

  if (!/^[1-9]\d*$/.test(issueId)) {
    return res.status(400).json({ error: 'Invalid issue ID' });
  }

  try {
    const pool = getDbPool();
    let rows;

    if (req.session.user.role === 'admin') {
      [rows] = await pool.execute(
        `SELECT i.*, u.full_name AS reporter_name
         FROM issues i
         JOIN users u ON u.id = i.reporter_id
         WHERE i.id = ?`,
        [issueId]
      );
    } else {
      [rows] = await pool.execute(
        `SELECT *
         FROM issues
         WHERE id = ? AND reporter_id = ?`,
        [issueId, req.session.user.id]
      );
    }

    if (!rows.length) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    const [history] = await pool.execute(
      `SELECT h.id, h.old_status, h.new_status, h.note,
              h.created_at, u.full_name AS changed_by_name
       FROM issue_history h
       JOIN users u ON u.id = h.changed_by
       WHERE h.issue_id = ?
       ORDER BY h.created_at ASC, h.id ASC`,
      [issueId]
    );

    return res.json({ issue: rows[0], history });
  } catch (error) {
    console.error('Get issue failed:', error.message);
    return res.status(500).json({ error: 'Unable to retrieve issue' });
  }
});

export default router;
