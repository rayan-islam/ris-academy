import { NextRequest } from 'next/server';
import { db } from '@ris-academy/db';
import { apiSuccess, apiError, requireAdmin, AuthError } from '@/lib/api-utils';
import { Role } from '@prisma/client';

const VALID_ROLES: Role[] = ['STUDENT', 'TEACHER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'];

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

    if (!user) return apiError('User not found', 404);

    return apiSuccess(user);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Admin user detail error:', error);
    return apiError('Failed to fetch user', 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const admin = await requireAdmin();

    const body = await req.json();
    const { isActive, role } = body;

    if (role !== undefined && !(VALID_ROLES as string[]).includes(role)) {
      return apiError('Invalid role. Must be one of: ' + VALID_ROLES.join(', '), 422);
    }

    const existing = await db.user.findUnique({ where: { id: params.id } });
    if (!existing) return apiError('User not found', 404);

    if (existing.role === 'SUPER_ADMIN' && admin.role !== 'SUPER_ADMIN') {
      return apiError('Only a Super Admin can modify another Super Admin', 403);
    }

    if (role === 'SUPER_ADMIN' && admin.role !== 'SUPER_ADMIN') {
      return apiError('Only a Super Admin can promote to Super Admin', 403);
    }

    if (role === 'ADMIN' && admin.role !== 'SUPER_ADMIN' && existing.id === admin.id) {
      return apiError('Cannot change your own role', 403);
    }

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
    console.error('Admin update user error:', error);
    return apiError('Failed to update user', 500);
  }
}
