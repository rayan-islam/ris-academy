import { NextRequest } from 'next/server';
import { db } from '@ris-academy/db';
import { apiSuccess, apiError, requireAuth, AuthError } from '@/lib/api-utils';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireAuth();

    const payment = await db.payment.findUnique({
      where: { id: params.id },
      include: {
        course: {
          select: { title: true },
        },
        user: {
          select: { name: true, email: true },
        },
      },
    });

    if (!payment) {
      return apiError('Payment not found', 404);
    }

    if (payment.userId !== user.id) {
      return apiError('Forbidden', 403);
    }

    return apiSuccess(payment);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Payment detail error:', error);
    return apiError('Failed to fetch payment', 500);
  }
}
