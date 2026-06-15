import { NextRequest } from 'next/server';
import { db } from '@ris-academy/db';
import { apiSuccess, apiError, requireAdmin, AuthError } from '@/lib/api-utils';
import { examCreateSchema } from '@/lib/validators';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    const where = search
      ? { title: { contains: search, mode: 'insensitive' as const } }
      : {};

    const exams = await db.exam.findMany({
      where,
      include: { _count: { select: { questions: true, attempts: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return apiSuccess(exams);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Admin list exams error:', error);
    return apiError('Failed to fetch exams', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json();
    const parsed = examCreateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors.map((e) => e.message).join(', '), 422);
    }

    const exam = await db.exam.create({
      data: parsed.data,
    });

    return apiSuccess(exam, 201);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Admin create exam error:', error);
    return apiError('Failed to create exam', 500);
  }
}
