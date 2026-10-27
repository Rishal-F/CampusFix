import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import express from 'express';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { createIssuesRouter } from '../routes/issues.js';
import { getImageStorage } from '../services/imageStorage.js';
import { createLocalStorage, localStorage } from '../services/localStorage.js';
import { createS3Storage } from '../services/s3Storage.js';

const validPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jZ2kAAAAASUVORK5CYII=',
  'base64',
);
const issueImageKey = 'complaints/123e4567-e89b-12d3-a456-426614174000.png';

let server;
let baseUrl;
let state;
let storage;
let storageCalls;

function createPool() {
  return {
    async getConnection() {
      const snapshot = {
        issues: state.issues.map((issue) => ({ ...issue })),
        history: [...state.history],
      };
      return {
        async beginTransaction() {
          state.transaction.begun = true;
        },
        async commit() {
          state.transaction.committed = true;
        },
        async rollback() {
          state.transaction.rolledBack = true;
          state.issues = snapshot.issues;
          state.history = snapshot.history;
        },
        release() {
          state.transaction.released = true;
        },
        async execute(sql, parameters = []) {
          if (sql.includes('INSERT INTO issues')) {
            if (state.failIssueInsert) throw new Error('simulated issue insert failure');
            const issue = {
              id: state.nextId++,
              reporter_id: parameters[0],
              title: parameters[1],
              description: parameters[2],
              category: parameters[3],
              location: parameters[4],
              priority: parameters[5],
              image_key: parameters[6],
              status: 'reported',
            };
            state.issues.push(issue);
            return [{ insertId: issue.id }];
          }
          if (sql.includes('INSERT INTO issue_history')) {
            state.history.push({
              issue_id: parameters[0],
              changed_by: parameters[1],
              old_status: null,
              new_status: 'reported',
              note: parameters[2],
            });
            return [{ insertId: state.history.length }];
          }
          throw new Error(`Unexpected transaction query: ${sql}`);
        },
      };
    },
    async execute(sql, parameters = []) {
      if (sql.includes('SELECT reporter_id, image_key FROM issues')) {
        const issue = state.issues.find((item) => String(item.id) === String(parameters[0]));
        return [issue ? [{
          reporter_id: issue.reporter_id,
          image_key: issue.image_key,
        }] : []];
      }
      throw new Error(`Unexpected pool query: ${sql}`);
    },
  };
}

function validFields(form) {
  form.append('title', 'Broken classroom light');
  form.append('description', 'The light stopped working in this classroom.');
  form.append('category', 'Electrical');
  form.append('location', 'Block B, Room 204');
}

async function postJson(body, { role = 'student', userId = '17' } = {}) {
  return fetch(`${baseUrl}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Test-Role': role,
      'X-Test-User-Id': userId,
    },
    body: JSON.stringify(body),
  });
}

async function postImage(bytes = validPng, { role = 'student', userId = '17' } = {}) {
  const form = new FormData();
  validFields(form);
  form.append('image', new Blob([bytes], { type: 'image/png' }), 'complaint.png');
  return fetch(`${baseUrl}/`, {
    method: 'POST',
    headers: {
      'X-Test-Role': role,
      'X-Test-User-Id': userId,
    },
    body: form,
  });
}

async function getImage({ role, userId = '17', id = '7' } = {}) {
  const headers = {};
  if (role) headers['X-Test-Role'] = role;
  if (role) headers['X-Test-User-Id'] = userId;
  return fetch(`${baseUrl}/${id}/image`, { headers });
}

beforeEach(async () => {
  state = {
    issues: [],
    history: [],
    nextId: 8,
    failIssueInsert: false,
    transaction: {
      begun: false,
      committed: false,
      rolledBack: false,
      released: false,
    },
  };
  storageCalls = { uploads: [], deletes: [], gets: [], failUpload: false };
  storage = {
    async uploadImage(image) {
      storageCalls.uploads.push(image);
      if (storageCalls.failUpload) throw new Error('simulated S3 upload failure');
      return issueImageKey;
    },
    async deleteImage(key) {
      storageCalls.deletes.push(key);
    },
    async getImage(key) {
      storageCalls.gets.push(key);
      return {
        Body: Readable.from([validPng]),
        ContentLength: validPng.length,
        ContentType: 'image/png',
      };
    },
  };

  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    const role = req.get('x-test-role');
    if (role) {
      req.session = {
        user: {
          id: req.get('x-test-user-id') || '17',
          role,
        },
      };
    }
    next();
  });
  app.use('/api/issues', createIssuesRouter({
    poolProvider: createPool,
    imageStorage: storage,
  }));
  app.use((error, _req, res, _next) => {
    res.status(500).json({ error: error.message });
  });

  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api/issues`;
});

afterEach(async () => {
  if (server) {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});

test('valid image upload verifies the signature and stores a private object key', async () => {
  const response = await postImage();
  assert.equal(response.status, 201);
  assert.equal(storageCalls.uploads.length, 1);
  assert.equal(storageCalls.uploads[0].contentType, 'image/png');
  assert.deepEqual(storageCalls.uploads[0].buffer, validPng);
  assert.equal(state.issues[0].image_key, issueImageKey);
  assert.equal(state.history[0].new_status, 'reported');
  assert.equal(state.transaction.committed, true);
});

test('image content with an unsupported signature is rejected before S3 or database writes', async () => {
  const response = await postImage(Buffer.from('not an image'));
  assert.equal(response.status, 400);
  assert.equal(storageCalls.uploads.length, 0);
  assert.equal(state.issues.length, 0);
});

test('images larger than 5 MB are rejected by multipart limits', async () => {
  const response = await postImage(Buffer.alloc(5 * 1024 * 1024 + 1, 1));
  assert.equal(response.status, 413);
  assert.equal(storageCalls.uploads.length, 0);
  assert.equal(state.issues.length, 0);
});

test('authentication and student authorization happen before multipart upload parsing', async () => {
  const unauthenticatedForm = new FormData();
  validFields(unauthenticatedForm);
  unauthenticatedForm.append('image', new Blob([validPng]), 'complaint.png');
  const unauthenticated = await fetch(`${baseUrl}/`, {
    method: 'POST',
    body: unauthenticatedForm,
  });
  assert.equal(unauthenticated.status, 401);

  const admin = await postImage(Buffer.alloc(5 * 1024 * 1024 + 1, 1), { role: 'admin' });
  assert.equal(admin.status, 403);
  assert.equal(storageCalls.uploads.length, 0);
  assert.equal(state.issues.length, 0);
});

test('complaint creation without an image preserves the transaction and initial history', async () => {
  const response = await postJson({
    title: 'Broken classroom light',
    description: 'The light stopped working in this classroom.',
    category: 'Electrical',
    location: 'Block B, Room 204',
  });
  assert.equal(response.status, 201);
  assert.equal(state.issues[0].image_key, null);
  assert.equal(state.history[0].note, 'Issue submitted');
  assert.equal(storageCalls.uploads.length, 0);
  assert.equal(state.transaction.committed, true);
});

test('S3 upload failure prevents complaint and history creation', async () => {
  storageCalls.failUpload = true;
  const response = await postImage();
  assert.equal(response.status, 500);
  assert.equal(state.issues.length, 0);
  assert.equal(state.history.length, 0);
  assert.equal(state.transaction.begun, false);
});

test('database failure rolls back and removes the uploaded image', async () => {
  state.failIssueInsert = true;
  const response = await postImage();
  assert.equal(response.status, 500);
  assert.deepEqual(storageCalls.deletes, [issueImageKey]);
  assert.equal(state.transaction.rolledBack, true);
  assert.equal(state.transaction.released, true);
  assert.equal(state.issues.length, 0);
});

test('JSON complaint submissions remain supported', async () => {
  const response = await postJson({
    title: 'Broken classroom light',
    description: 'The light stopped working in this classroom.',
    category: 'Electrical',
    location: 'Block B, Room 204',
  });
  assert.equal(response.status, 201);
  assert.equal((await response.json()).issue.status, 'reported');
  assert.equal(storageCalls.uploads.length, 0);
});

test('image retrieval requires an authenticated session', async () => {
  state.issues.push({ id: 7, reporter_id: 17, image_key: issueImageKey });
  const response = await getImage({});
  assert.equal(response.status, 401);
  assert.equal(storageCalls.gets.length, 0);
});

test('a different student cannot retrieve another student image', async () => {
  state.issues.push({ id: 7, reporter_id: 17, image_key: issueImageKey });
  const response = await getImage({ role: 'student', userId: '18' });
  assert.equal(response.status, 403);
  assert.equal(storageCalls.gets.length, 0);
});

test('the issue owner can retrieve an image with safe response headers', async () => {
  state.issues.push({ id: 7, reporter_id: 17, image_key: issueImageKey });
  const response = await getImage({ role: 'student', userId: '17' });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'image/png');
  assert.equal(response.headers.get('content-disposition'), 'inline; filename="issue-image"');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), validPng);
  assert.deepEqual(storageCalls.gets, [issueImageKey]);
});

test('an admin can retrieve a student complaint image', async () => {
  state.issues.push({ id: 7, reporter_id: 17, image_key: issueImageKey });
  const response = await getImage({ role: 'admin', userId: '42' });
  assert.equal(response.status, 200);
  assert.deepEqual(storageCalls.gets, [issueImageKey]);
});

test('image retrieval returns 404 when the issue has no image', async () => {
  state.issues.push({ id: 7, reporter_id: 17, image_key: null });
  const response = await getImage({ role: 'student', userId: '17' });
  assert.equal(response.status, 404);
  assert.equal(storageCalls.gets.length, 0);
});

test('image retrieval returns 404 when the private object is missing', async () => {
  state.issues.push({ id: 7, reporter_id: 17, image_key: issueImageKey });
  storage.getImage = async () => {
    const error = new Error('missing');
    error.name = 'NoSuchKey';
    throw error;
  };
  const response = await getImage({ role: 'student', userId: '17' });
  assert.equal(response.status, 404);
});

test('local provider stores and serves complaint images without using S3', async () => {
  const storageDir = await mkdtemp(join(tmpdir(), 'campusfix-local-storage-'));
  Object.assign(storage, createLocalStorage({ storageDir }));

  try {
    assert.equal(getImageStorage('local'), localStorage);
    const upload = await postImage();
    assert.equal(upload.status, 201);
    assert.match(state.issues[0].image_key, /^complaints\/[0-9a-f-]{36}\.png$/);

    const response = await getImage({ role: 'admin', userId: '42', id: '8' });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'image/png');
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), validPng);
  } finally {
    await rm(storageDir, { recursive: true, force: true });
  }
});

test('local storage rejects path traversal keys', async () => {
  const storageDir = await mkdtemp(join(tmpdir(), 'campusfix-local-storage-'));
  const local = createLocalStorage({ storageDir });

  try {
    await assert.rejects(local.getImage('../outside.png'), /Invalid local image key/);
    await assert.rejects(local.deleteImage('complaints/..\\outside.png'), /Invalid local image key/);
  } finally {
    await rm(storageDir, { recursive: true, force: true });
  }
});

test('the S3 service sends put, get, and delete commands through an injected client', async () => {
  const commands = [];
  const client = {
    async send(command) {
      commands.push(command);
      return { Body: Readable.from([validPng]), ContentType: 'image/png' };
    },
  };
  const service = createS3Storage({
    client,
    bucketName: 'test-private-bucket',
    region: 'ap-south-1',
  });

  const key = await service.uploadImage({ buffer: validPng, contentType: 'image/png' });
  assert.match(key, /^complaints\/[0-9a-f-]{36}\.png$/);
  assert.ok(commands[0] instanceof PutObjectCommand);
  assert.equal(commands[0].input.Bucket, 'test-private-bucket');
  assert.equal(commands[0].input.Key, key);
  assert.equal(commands[0].input.ACL, undefined);
  await service.getImage(key);
  assert.ok(commands[1] instanceof GetObjectCommand);
  await service.deleteImage(key);
  assert.ok(commands[2] instanceof DeleteObjectCommand);
});
