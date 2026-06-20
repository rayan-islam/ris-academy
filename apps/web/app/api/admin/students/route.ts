import { NextRequest } from 'next/server';
import { db } from '@ris-academy/db';
import { apiError, apiPaginated, requireAdmin, AuthError } from '@/lib/api-utils';
import { Role } from '@prisma/client';

const VALID_ROLES: Role[] = ['STUDENT', 'TEACHER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'];

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = req.nextUrl;
    const search = searchParams.get('search');
    const hscYear = searchParams.get('hscYear');
    const isActiveParam = searchParams.get('isActive');
    const roleParam = searchParams.get('role');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get('limit') || '20', 10)));

    const where: Record<string, unknown> = {};

    if (roleParam && (VALID_ROLES as string[]).includes(roleParam)) {
      where.role = roleParam;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (hscYear) {
      where.hscYear = hscYear;
    }

    if (isActiveParam !== null && isActiveParam !== undefined && isActiveParam !== '') {
      where.isActive = isActiveParam === 'true';
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where: where as any,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
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
          _count: { select: { enrollments: true, examAttempts: true } },
        },
      }),
      db.user.count({ where: where as any }),
    ]);

    return apiPaginated(users, total, page, limit);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Admin users list error:', error);
    return apiError('Failed to fetch users', 500);
  }
}
