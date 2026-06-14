import { NextRequest } from 'next/server';
import { db } from '@ris-academy/db';
import { apiSuccess, apiError } from '@/lib/api-utils';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { token, email, password } = await req.json();

    if (!token || !email || !password) return apiError('Token, email, and password are required', 422);

    if (password.length < 6) return apiError('Password must be at least 6 characters', 422);

    const verificationToken = await db.verificationToken.findUnique({
      where: { identifier_token: { identifier: email, token } },
    });

    if (!verificationToken) return apiError('Invalid or expired token', 400);

    if (new Date() > verificationToken.expires) {
      await db.verificationToken.delete({
        where: { identifier_token: { identifier: email, token } },
      });
      return apiError('Token has expired', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await db.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    await db.verificationToken.delete({
      where: { identifier_token: { identifier: email, token } },
    });

    return apiSuccess({ reset: true });
  } catch (error) {
    console.error('Reset password error:', error);
    return apiError('Failed to reset password', 500);
  }
}
