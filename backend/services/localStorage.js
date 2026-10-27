import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, realpath, stat, unlink, writeFile } from 'node:fs/promises';
import { basename, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const extensionsByContentType = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const keyPattern = /^complaints\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.(jpg|png|webp)$/;
const defaultStorageDir = fileURLToPath(new URL('../uploads/', import.meta.url));

export function createLocalStorage({ storageDir = process.env.LOCAL_STORAGE_DIR || defaultStorageDir } = {}) {
  const root = resolve(storageDir);
  const complaintsDir = resolve(root, 'complaints');

  function getImagePath(key) {
    if (typeof key !== 'string' || !keyPattern.test(key)) {
      throw new Error('Invalid local image key');
    }

    const filePath = resolve(complaintsDir, basename(key));
    const fromDirectory = relative(complaintsDir, filePath);
    if (!fromDirectory || fromDirectory.startsWith(`..${sep}`) || isAbsolute(fromDirectory)) {
      throw new Error('Invalid local image key');
    }
    return filePath;
  }

  async function ensureImageIsInsideStorage(filePath) {
    const [realDirectory, realFile] = await Promise.all([
      realpath(complaintsDir),
      realpath(filePath),
    ]);
    if (!realFile.startsWith(`${realDirectory}${sep}`)) {
      throw new Error('Local image path escapes the storage directory');
    }
  }

  return {
    async uploadImage({ buffer, contentType }) {
      const extension = extensionsByContentType[contentType];
      if (!extension) throw new Error('Unsupported image content type');

      await mkdir(complaintsDir, { recursive: true, mode: 0o700 });
      const key = `complaints/${randomUUID()}.${extension}`;
      const filePath = getImagePath(key);
      await writeFile(filePath, buffer, { flag: 'wx', mode: 0o600 });
      return key;
    },

    async getImage(key) {
      const filePath = getImagePath(key);
      await ensureImageIsInsideStorage(filePath);
      const fileStats = await stat(filePath);
      const extension = key.slice(key.lastIndexOf('.') + 1);
      const contentType = Object.entries(extensionsByContentType)
        .find(([, value]) => value === extension)?.[0];
      if (!contentType) throw new Error('Unsupported local image type');

      return {
        Body: createReadStream(filePath),
        ContentLength: fileStats.size,
        ContentType: contentType,
      };
    },

    async deleteImage(key) {
      const filePath = getImagePath(key);
      await ensureImageIsInsideStorage(filePath);
      await unlink(filePath);
    },
  };
}

export const localStorage = createLocalStorage();
