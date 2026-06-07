import { NextRequest } from 'next/server';
import { db } from '@ris-academy/db';
import { apiSuccess, apiError, requireAdmin, AuthError, apiPaginated } from '@/lib/api-utils';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = req.nextUrl;
    const status = searchParams.get('status');
    const studentSearch = searchParams.get('studentSearch');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const where: Prisma.PaymentWhereInput = {};

    if (status) {
      where.status = status as any;
    }

    if (studentSearch) {
      where.user = {
        OR: [
          { name: { contains: studentSearch, mode: 'insensitive' } },
          { email: { contains: studentSearch, mode: 'insensitive' } },
        ],
      };
    }

    if (search) {
      where.OR = [
        { transactionId: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        (where.createdAt as any).gte = new Date(dateFrom);
      }
      if (dateTo) {
        (where.createdAt as any).lte = new Date(dateTo);
      }
    }

    const [payments, total] = await Promise.all([
      db.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: { name: true, email: true },
          },
          course: {
            select: { title: true },
          },
        },
      }),
      db.payment.count({ where }),
    ]);

    return apiPaginated(payments, total, page, limit);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Admin payments fetch error:', error);
    return apiError('Failed to fetch payments', 500);
  }
}
