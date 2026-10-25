import { randomUUID } from 'node:crypto';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

const extensionsByContentType = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export function createS3Storage({
  client,
  bucketName,
  region,
} = {}) {
  let s3Client = client;

  function getClient() {
    if (!s3Client) {
      s3Client = new S3Client({
        region: region || process.env.AWS_REGION || 'ap-south-1',
      });
    }
    return s3Client;
  }

  function getBucketName() {
    const bucket = bucketName || process.env.S3_BUCKET_NAME;
    if (!bucket) {
      throw new Error('S3_BUCKET_NAME is not configured');
    }
    return bucket;
  }

  return {
    async uploadImage({ buffer, contentType }) {
      const extension = extensionsByContentType[contentType];
      if (!extension) {
        throw new Error('Unsupported image content type');
      }

      const bucket = getBucketName();
      const key = `complaints/${randomUUID()}.${extension}`;
      await getClient().send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }));
      return key;
    },

    async getImage(key) {
      const bucket = getBucketName();
      return getClient().send(new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }));
    },

    async deleteImage(key) {
      const bucket = getBucketName();
      await getClient().send(new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      }));
    },
  };
}

export const s3Storage = createS3Storage();
