import { NextRequest } from 'next/server';
import { db } from '@ris-academy/db';
import { apiSuccess, apiError, requireAdmin, AuthError } from '@/lib/api-utils';
import { initiateSSLRefund } from '@/lib/payments/sslcommerz';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin();

    const payment = await db.payment.findUnique({ where: { id: params.id } });
    if (!payment) {
      return apiError('Payment not found', 404);
    }

    if (payment.status !== 'COMPLETED') {
      return apiError('Only completed payments can be refunded', 400);
    }

    const gatewayResponse = payment.gatewayResponse as Record<string, unknown> | null;
    const bankTranId = (gatewayResponse?.bank_tran_id as string) || payment.transactionId || '';

    const refundResult = await initiateSSLRefund(
      bankTranId,
      payment.amount,
      'Refund requested by admin',
    );

    if (!refundResult) {
      return apiError('Refund initiation failed', 500);
    }

    await db.payment.update({
      where: { id: payment.id },
      data: { status: 'REFUNDED' },
    });

    return apiSuccess({ message: 'Refund initiated successfully' });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Refund error:', error);
    return apiError('Failed to process refund', 500);
  }
}
