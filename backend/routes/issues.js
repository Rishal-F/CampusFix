import { Router } from 'express';
import multer from 'multer';
import { fileTypeFromBuffer } from 'file-type';
import { getDbPool } from '../config/db.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { s3Storage } from '../services/s3Storage.js';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const allowedPriorities = ['low', 'medium', 'high', 'urgent'];

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_IMAGE_SIZE,
    files: 1,
    fields: 10,
    parts: 11,
  },
}).single('image');

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

function requireStudent(req, res, next) {
  if (req.session.user.role !== 'student') {
    return res.status(403).json({
      error: 'Only student accounts can submit issues',
    });
  }
  return next();
}

function parseOptionalImage(req, res, next) {
  if (!req.is('multipart/form-data')) return next();

  imageUpload(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Image must be 5 MB or smaller' });
    }
    return res.status(400).json({
      error: 'Invalid multipart form data or unsupported upload fields',
    });
  });
}

function isMissingS3Object(error) {
  return error?.name === 'NoSuchKey'
    || error?.name === 'NotFound'
    || error?.$metadata?.httpStatusCode === 404;
}

async function readImageBody(body) {
  if (!body) throw new Error('S3 returned an empty image body');

  if (Buffer.isBuffer(body)) {
    if (body.length > MAX_IMAGE_SIZE) throw new Error('Stored image exceeds the size limit');
    return body;
  }

  if (body[Symbol.asyncIterator]) {
    const chunks = [];
    let size = 0;
    for await (const chunk of body) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += buffer.length;
      if (size > MAX_IMAGE_SIZE) throw new Error('Stored image exceeds the size limit');
      chunks.push(buffer);
    }
    return Buffer.concat(chunks, size);
  }

  if (typeof body.transformToByteArray === 'function') {
    const buffer = Buffer.from(await body.transformToByteArray());
    if (buffer.length > MAX_IMAGE_SIZE) throw new Error('Stored image exceeds the size limit');
    return buffer;
  }

  throw new Error('S3 returned an unsupported image body');
}

export function createIssuesRouter({
  poolProvider = getDbPool,
  imageStorage = s3Storage,
} = {}) {
  const router = Router();

  router.use(requireAuth);

  // List issues: students see their own; admins see all.
  router.get('/', async (req, res) => {
    try {
      const pool = poolProvider();
      let rows;

      if (req.session.user.role === 'admin') {
        [rows] = await pool.execute(
          `SELECT i.id, i.reporter_id, i.title, i.description,
                  i.category, i.location, i.priority, i.status,
                  i.assigned_to, i.image_key IS NOT NULL AS has_image,
                  i.created_at, i.updated_at,
                  u.full_name AS reporter_name
           FROM issues i
           JOIN users u ON u.id = i.reporter_id
           ORDER BY i.created_at DESC`
        );
      } else {
        [rows] = await pool.execute(
          `SELECT id, reporter_id, title, description, category,
                  location, priority, status, assigned_to,
                  image_key IS NOT NULL AS has_image,
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

  // Authenticate and check role before parsing a possibly large multipart body.
  router.post('/', requireStudent, parseOptionalImage, async (req, res) => {
    const body = req.body || {};
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const category = typeof body.category === 'string' ? body.category.trim() : '';
    const location = typeof body.location === 'string' ? body.location.trim() : '';

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

    let detectedType;
    if (req.file) {
      detectedType = await fileTypeFromBuffer(req.file.buffer);
      if (!detectedType || !allowedImageTypes.has(detectedType.mime)) {
        return res.status(400).json({
          error: 'Image must contain valid JPEG, PNG, or WebP data',
        });
      }
    }

    let connection;
    let uploadedKey;
    let transactionStarted = false;
    let committed = false;
    try {
      const priority = derivePriority(category, title, description);
      if (!allowedPriorities.includes(priority)) {
        return res.status(500).json({ error: 'Unable to determine issue priority' });
      }

      if (req.file) {
        uploadedKey = await imageStorage.uploadImage({
          buffer: req.file.buffer,
          contentType: detectedType.mime,
        });
      }

      connection = await poolProvider().getConnection();
      await connection.beginTransaction();
      transactionStarted = true;

      const [result] = await connection.execute(
        `INSERT INTO issues
           (reporter_id, title, description, category, location, priority, image_key)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          req.session.user.id,
          title,
          description,
          category,
          location,
          priority,
          uploadedKey || null,
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
      committed = true;

      return res.status(201).json({
        issue: {
          id: result.insertId,
          title,
          description,
          category,
          location,
          priority,
          status: 'reported',
          has_image: Boolean(uploadedKey),
        },
      });
    } catch (error) {
      let safeToDeleteUploadedImage = !transactionStarted;
      if (transactionStarted) {
        try {
          await connection.rollback();
          safeToDeleteUploadedImage = true;
        } catch (rollbackError) {
          console.error('Create issue rollback failed:', rollbackError.message);
        }
      }
      if (uploadedKey && !committed && safeToDeleteUploadedImage) {
        try {
          await imageStorage.deleteImage(uploadedKey);
        } catch (cleanupError) {
          console.error('Uploaded issue image cleanup failed:', cleanupError.message);
        }
      } else if (uploadedKey && !committed && !safeToDeleteUploadedImage) {
        console.error('Uploaded issue image retained because transaction outcome is uncertain');
      }
      console.error('Create issue failed:', error.message);
      return res.status(500).json({ error: 'Unable to submit issue' });
    } finally {
      if (connection) connection.release();
    }
  });

  // More specific than /:id; only the owner or an admin can retrieve the object.
  router.get('/:id/image', async (req, res) => {
    const issueId = req.params.id;
    if (!/^[1-9]\d*$/.test(issueId)) {
      return res.status(400).json({ error: 'Invalid issue ID' });
    }

    try {
      const [rows] = await poolProvider().execute(
        'SELECT reporter_id, image_key FROM issues WHERE id = ?',
        [issueId],
      );

      if (!rows.length || !rows[0].image_key) {
        return res.status(404).json({ error: 'Issue image not found' });
      }

      if (
        req.session.user.role !== 'admin'
        && String(rows[0].reporter_id) !== String(req.session.user.id)
      ) {
        return res.status(403).json({ error: 'You do not have permission to view this image' });
      }

      const key = rows[0].image_key;
      if (typeof key !== 'string' || !/^complaints\/[a-f0-9-]+\.(jpg|png|webp)$/.test(key)) {
        return res.status(404).json({ error: 'Issue image not found' });
      }

      const image = await imageStorage.getImage(key);
      if (!allowedImageTypes.has(image.ContentType) || image.ContentLength > MAX_IMAGE_SIZE) {
        return res.status(404).json({ error: 'Issue image not found' });
      }

      const content = await readImageBody(image.Body);
      res.set({
        'Content-Type': image.ContentType,
        'Content-Disposition': 'inline; filename="issue-image"',
        'Content-Length': String(content.length),
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store',
      });
      return res.status(200).end(content);
    } catch (error) {
      if (isMissingS3Object(error)) {
        return res.status(404).json({ error: 'Issue image not found' });
      }
      console.error('Get issue image failed:', error.message);
      return res.status(502).json({ error: 'Unable to retrieve issue image' });
    }
  });

  router.get('/:id', async (req, res) => {
    const issueId = req.params.id;

    if (!/^[1-9]\d*$/.test(issueId)) {
      return res.status(400).json({ error: 'Invalid issue ID' });
    }

    try {
      const pool = poolProvider();
      let rows;

      if (req.session.user.role === 'admin') {
        [rows] = await pool.execute(
          `SELECT i.id, i.reporter_id, i.title, i.description,
                  i.category, i.location, i.priority, i.status,
                  i.assigned_to, i.image_key IS NOT NULL AS has_image,
                  i.created_at, i.updated_at,
                  u.full_name AS reporter_name
           FROM issues i
           JOIN users u ON u.id = i.reporter_id
           WHERE i.id = ?`,
          [issueId]
        );
      } else {
        [rows] = await pool.execute(
          `SELECT id, reporter_id, title, description, category,
                  location, priority, status, assigned_to,
                  image_key IS NOT NULL AS has_image,
                  created_at, updated_at
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

  return router;
}

export default createIssuesRouter();
