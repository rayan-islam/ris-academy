import { NextRequest } from 'next/server';
import { apiSuccess, apiError, requireAuth, AuthError } from '@/lib/api-utils';
import { generateStorageKey, getPublicUrl } from '@/lib/storage';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

function getS3Client(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
  });
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth();

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'users';

    if (!file) return apiError('No file provided', 422);

    const allowedFolders = ['courses', 'exams', 'users', 'materials'];
    if (!allowedFolders.includes(folder)) {
      return apiError(`Folder must be one of: ${allowedFolders.join(', ')}`, 422);
    }

    if (file.size > 10 * 1024 * 1024) {
      return apiError('File too large. Maximum size is 10MB', 413);
    }

    const key = generateStorageKey(folder, file.name);
    const buffer = Buffer.from(await file.arrayBuffer());

    const client = getS3Client();
    const bucket = process.env.R2_BUCKET_NAME!;

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );

    const publicUrl = getPublicUrl(key);

    return apiSuccess({ url: publicUrl, key });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Upload error:', error);
    return apiError('Failed to upload file', 500);
  }
}
