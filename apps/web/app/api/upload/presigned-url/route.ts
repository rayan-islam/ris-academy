import { NextRequest } from 'next/server';
import { apiSuccess, apiError, requireAuth, AuthError } from '@/lib/api-utils';
import { getPresignedUploadUrl, getPublicUrl, generateStorageKey } from '@/lib/storage';

export async function POST(req: NextRequest) {
  try {
    await requireAuth();

    const body = await req.json();
    const { fileName, contentType, folder } = body;

    if (!fileName || !contentType || !folder) {
      return apiError('fileName, contentType, and folder are required', 422);
    }

    const allowedFolders = ['courses', 'exams', 'users', 'materials'];
    if (!allowedFolders.includes(folder)) {
      return apiError(`Folder must be one of: ${allowedFolders.join(', ')}`, 422);
    }

    const key = generateStorageKey(folder, fileName);
    const uploadUrl = await getPresignedUploadUrl(key, contentType);
    const publicUrl = getPublicUrl(key);

    console.log('=== R2 DEBUG ===');
    console.log('Key:', key);
    console.log('Upload URL:', uploadUrl);
    console.log('Public URL:', publicUrl);
    console.log('Endpoint:', process.env.R2_ENDPOINT);
    console.log('Bucket:', process.env.R2_BUCKET_NAME);
    console.log('===============');

    return apiSuccess({ uploadUrl, publicUrl, key });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    if (error instanceof Error && error.message === 'R2 credentials not configured') {
      return apiError('File storage is not configured', 503);
    }
    console.error('Presigned URL error:', error);
    return apiError('Failed to generate upload URL', 500);
  }
}
