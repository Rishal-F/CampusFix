import { localStorage } from './localStorage.js';
import { s3Storage } from './s3Storage.js';

export function getImageStorage(provider = process.env.STORAGE_PROVIDER || 's3') {
  if (provider === 'local') return localStorage;
  if (provider === 's3') return s3Storage;
  throw new Error(`Unsupported STORAGE_PROVIDER: ${provider}`);
}
