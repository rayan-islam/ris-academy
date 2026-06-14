import { NextRequest } from 'next/server';
import { db } from '@ris-academy/db';
import { apiSuccess, apiError, apiPaginated, requireAdmin, AuthError } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const subject = searchParams.get('subject') || '';
    const fileType = searchParams.get('fileType') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { chapter: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (subject) where.subject = subject;
    if (fileType) where.fileType = fileType;

    const [materials, total] = await Promise.all([
      db.material.findMany({
        where: where as any,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { name: true } },
        },
      }),
      db.material.count({ where: where as any }),
    ]);

    return apiPaginated(materials, total, page, limit);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Materials list error:', error);
    return apiError('Failed to fetch materials', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();

    const body = await req.json();
    const { title, fileUrl, fileType, fileSize, subject, chapter } = body;

    if (!title || !fileUrl || !fileType || !subject) {
      return apiError('Missing required fields: title, fileUrl, fileType, subject', 422);
    }

    const material = await db.material.create({
      data: {
        title,
        fileUrl,
        fileType,
        fileSize: fileSize || null,
        subject,
        chapter: chapter || null,
        uploadedBy: admin.id,
      },
      include: {
        user: { select: { name: true } },
      },
    });

    return apiSuccess(material, 201);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Materials create error:', error);
    return apiError('Failed to create material', 500);
  }
}
