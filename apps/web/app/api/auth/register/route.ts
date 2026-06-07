import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@ris-academy/db';
import { registerSchema } from '@/lib/validators';
import { apiSuccess, apiError } from '@/lib/api-utils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = registerSchema.safeParse(body);

    if (!validated.success) {
      return apiError(validated.error.errors[0]?.message || 'Invalid input');
    }

    const { name, email, password, hscYear, institution, phone } = validated.data;

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return apiError('A user with this email already exists', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        hscYear,
        institution,
        phone,
      },
    });

    return apiSuccess(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        message: 'Registration successful',
      },
      201,
    );
  } catch (error) {
    console.error('Registration error:', error);
    return apiError('An unexpected error occurred', 500);
  }
}
