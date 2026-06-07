import { NextRequest } from 'next/server';
import { db } from '@ris-academy/db';
import { apiSuccess, apiError, requireAuth, AuthError } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();

    const { searchParams } = req.nextUrl;
    const status = searchParams.get('status');

    const where: Record<string, unknown> = { userId: user.id };
    if (status) {
      where.status = status;
    }

    const payments = await db.payment.findMany({
      where: where as any,
      orderBy: { createdAt: 'desc' },
      include: {
        course: {
          select: { title: true },
        },
      },
    });

    return apiSuccess(payments);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Payments fetch error:', error);
    return apiError('Failed to fetch payments', 500);
  }
}
