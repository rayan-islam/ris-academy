import { NextRequest } from 'next/server';
import { apiSuccess, apiError, requireAuth, AuthError } from '@/lib/api-utils';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireAuth();

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return apiError('No file provided', 400);
    }

    if (file.type !== 'application/pdf') {
      return apiError('Only PDF files are allowed', 400);
    }

    if (file.size > 20 * 1024 * 1024) {
      return apiError('File size must be under 20MB', 400);
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `${timestamp}_${sanitizedName}`;
    const filepath = path.join(uploadsDir, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    return apiSuccess({ url: `/uploads/${filename}` });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('File upload error:', error);
    return apiError('Failed to upload file', 500);
  }
}
