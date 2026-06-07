import { NextRequest } from 'next/server';
import { db } from '@ris-academy/db';
import { apiSuccess, apiError, requireAdmin, AuthError } from '@/lib/api-utils';
import { courseCreateSchema } from '@/lib/validators';

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json();
    const parsed = courseCreateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors.map((e) => e.message).join(', '), 422);
    }

    const course = await db.course.create({
      data: parsed.data,
    });

    return apiSuccess(course, 201);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Admin create course error:', error);
    return apiError('Failed to create course', 500);
  }
}
