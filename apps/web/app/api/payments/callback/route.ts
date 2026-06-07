import { NextRequest, NextResponse } from 'next/server';
import { db } from '@ris-academy/db';
import { validateSSLCPayment } from '@/lib/payments/sslcommerz';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const status = searchParams.get('status');
    const valId = searchParams.get('val_id');
    const tranId = searchParams.get('tran_id');

    if (!tranId) {
      return NextResponse.redirect(new URL('/dashboard?payment=error', req.url));
    }

    const payment = await db.payment.findUnique({ where: { transactionId: tranId } });
    if (!payment) {
      return NextResponse.redirect(new URL('/dashboard?payment=error', req.url));
    }

    const courseId = payment.courseId;

    if (status === 'success') {
      let validationData: unknown = null;

      if (valId) {
        validationData = await validateSSLCPayment(valId);
      }

      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          gatewayResponse: validationData as object,
        },
      });

      await db.enrollment.create({
        data: {
          userId: payment.userId,
          courseId: payment.courseId!,
        },
      });

      const course = await db.course.findUnique({
        where: { id: payment.courseId! },
        select: { title: true },
      });

      await db.notification.create({
        data: {
          userId: payment.userId,
          title: 'Payment Successful',
          message: `Your payment for "${course?.title || 'the course'}" was successful. You can now access the course.`,
          type: 'PAYMENT',
          link: `/courses/${payment.courseId}/learn`,
        },
      });

      return NextResponse.redirect(new URL(`/courses/${courseId}/learn`, req.url));
    }

    if (status === 'fail') {
      await db.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });

      return NextResponse.redirect(new URL(`/courses/${courseId}?payment=failed`, req.url));
    }

    if (status === 'cancel') {
      await db.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });

      return NextResponse.redirect(new URL(`/courses/${courseId}?payment=cancelled`, req.url));
    }

    return NextResponse.redirect(new URL('/dashboard', req.url));
  } catch (error) {
    console.error('Payment callback error:', error);
    return NextResponse.redirect(new URL('/dashboard?payment=error', req.url));
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tran_id, val_id } = body as { tran_id?: string; val_id?: string };

    if (!tran_id || !val_id) {
      return NextResponse.json({ status: 'INVALID' }, { status: 400 });
    }

    const validationData = await validateSSLCPayment(val_id);

    if (validationData && validationData.status === 'VALID') {
      await db.payment.updateMany({
        where: { transactionId: tran_id },
        data: {
          status: 'COMPLETED',
          gatewayResponse: validationData as unknown as object,
        },
      });
    }

    return NextResponse.json({ status: 'OK' }, { status: 200 });
  } catch (error) {
    console.error('IPN error:', error);
    return NextResponse.json({ status: 'ERROR' }, { status: 500 });
  }
}
