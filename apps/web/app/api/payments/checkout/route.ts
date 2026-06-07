import { NextRequest } from 'next/server';
import { db } from '@ris-academy/db';
import { apiSuccess, apiError, requireAuth, AuthError } from '@/lib/api-utils';
import { createSSLCSession } from '@/lib/payments/sslcommerz';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await req.json();
    const { courseId } = body as { courseId: string };

    if (!courseId) {
      return apiError('Course ID is required', 400);
    }

    const course = await db.course.findUnique({ where: { id: courseId } });
    if (!course || !course.isPublished) {
      return apiError('Course not found', 404);
    }

    if (course.type !== 'PAID') {
      return apiError('This course is free. Please enroll directly.', 400);
    }

    if (!course.price || course.price <= 0) {
      return apiError('Invalid course price', 400);
    }

    const existingEnrollment = await db.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId } },
    });

    if (existingEnrollment) {
      return apiError('Already enrolled in this course', 409);
    }

    const transactionId = `TRX-${Date.now()}-${user.id.slice(0, 6)}`;

    const payment = await db.payment.create({
      data: {
        userId: user.id,
        courseId,
        amount: course.price,
        currency: 'BDT',
        method: 'SSLCOMMERZ',
        status: 'PENDING',
        transactionId,
      },
    });

    const session = await createSSLCSession({
      total_amount: course.price,
      currency: 'BDT',
      tran_id: transactionId,
      success_url: 'http://localhost:3000/api/payments/callback?status=success',
      fail_url: 'http://localhost:3000/api/payments/callback?status=fail',
      cancel_url: `http://localhost:3000/courses/${courseId}`,
      ipn_url: 'http://localhost:3000/api/payments/callback?type=ipn',
      cus_name: user.name || 'Student',
      cus_email: user.email,
      cus_phone: user.phone || '01XXXXXXXXX',
      product_name: course.title,
      product_category: 'Education',
      product_profile: 'non-physical-goods',
    });

    if (session && session.GatewayPageURL) {
      return apiSuccess({ paymentUrl: session.GatewayPageURL });
    }

    await db.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED' },
    });

    return apiError('Payment session creation failed', 500);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Checkout error:', error);
    return apiError('Failed to create payment session', 500);
  }
}
