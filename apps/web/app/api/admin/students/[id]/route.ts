import { NextRequest } from 'next/server';
import { db } from '@ris-academy/db';
import { apiSuccess, apiError, requireAdmin, AuthError } from '@/lib/api-utils';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin();

    const user = await db.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        institution: true,
        hscYear: true,
        bio: true,
        image: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { enrollments: true, examAttempts: true } },
        enrollments: {
          include: {
            course: {
              select: { id: true, title: true, subject: true, type: true },
            },
          },
          orderBy: { enrolledAt: 'desc' },
        },
        examAttempts: {
          include: {
            exam: {
              select: { id: true, title: true, subject: true, examType: true },
            },
          },
          orderBy: { submittedAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!user) return apiError('Student not found', 404);

    return apiSuccess(user);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Admin student detail error:', error);
    return apiError('Failed to fetch student', 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin();

    const body = await req.json();
    const { isActive, role } = body;

    const existing = await db.user.findUnique({ where: { id: params.id } });
    if (!existing) return apiError('Student not found', 404);

    const user = await db.user.update({
      where: { id: params.id },
      data: {
        ...(isActive !== undefined && { isActive }),
        ...(role !== undefined && { role }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        institution: true,
        hscYear: true,
        bio: true,
        image: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return apiSuccess(user);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Admin update student error:', error);
    return apiError('Failed to update student', 500);
  }
}
