import { NextRequest } from 'next/server';
import { db } from '@ris-academy/db';
import { apiSuccess, apiError } from '@/lib/api-utils';
import { sendOTPEmail, generateOTP } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) return apiError('Email is required', 422);

    const user = await db.user.findUnique({ where: { email } });
    if (!user) return apiError('User not found', 404);

    if (user.emailVerified) return apiError('Email already verified', 400);

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await db.user.update({
      where: { id: user.id },
      data: { otp, otpExpires },
    });

    await sendOTPEmail(email, otp);

    return apiSuccess({ sent: true });
  } catch (error) {
    console.error('Resend OTP error:', error);
    return apiError('Failed to resend OTP', 500);
  }
}
