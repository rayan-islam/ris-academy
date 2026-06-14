import { NextRequest } from 'next/server';
import { db } from '@ris-academy/db';
import { apiSuccess, apiError } from '@/lib/api-utils';

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) return apiError('Email and OTP are required', 422);

    const user = await db.user.findUnique({ where: { email } });
    if (!user) return apiError('User not found', 404);

    if (!user.otp || !user.otpExpires) return apiError('No OTP requested', 400);

    if (new Date() > user.otpExpires) return apiError('OTP has expired', 400);

    if (user.otp !== otp) return apiError('Invalid OTP', 400);

    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        otp: null,
        otpExpires: null,
      },
    });

    return apiSuccess({ verified: true });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return apiError('Failed to verify OTP', 500);
  }
}
