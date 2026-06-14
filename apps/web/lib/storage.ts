import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

function getS3Client(): S3Client {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 credentials not configured');
  }

  const client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });

  (client.middlewareStack as any).addRelativeTo(
    (next: any) => async (args: any) => {
      const { request } = args;
      if (request?.headers) {
        delete request.headers['x-amz-checksum-crc32'];
        delete request.headers['x-amz-sdk-checksum-algorithm'];
        delete request.headers['x-amz-checksum-sha256'];
      }
      return next(args);
    },
    {
      name: 'removeChecksumHeaders',
      toMiddleware: 'build',
      relation: 'after' as any,
    } as any
  );

  return client;
}

export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600
): Promise<string> {
  const client = getS3Client();
  const bucket = process.env.R2_BUCKET_NAME!;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ChecksumAlgorithm: undefined,
  } as any);

  return getSignedUrl(client, command, { expiresIn });
}

export function getPublicUrl(key: string): string {
  const publicBase = process.env.R2_PUBLIC_URL;
  if (publicBase) {
    return `${publicBase.replace(/\/$/, '')}/${key}`;
  }
  const endpoint = process.env.R2_ENDPOINT!;
  const bucket = process.env.R2_BUCKET_NAME!;
  return `${endpoint}/${bucket}/${key}`;
}

export async function deleteObject(key: string): Promise<void> {
  const client = getS3Client();
  const bucket = process.env.R2_BUCKET_NAME!;

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
}

export function generateStorageKey(
  folder: string,
  fileName: string
): string {
  const timestamp = Date.now();
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${folder}/${timestamp}-${safeName}`;
}
