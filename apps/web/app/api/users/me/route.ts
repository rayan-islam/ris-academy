import { NextRequest } from 'next/server';
import { db } from '@ris-academy/db';
import { apiSuccess, apiError, requireAuth, AuthError } from '@/lib/api-utils';

export async function GET() {
  try {
    const user = await requireAuth();

    const { password, ...userWithoutPassword } = user;

    return apiSuccess(userWithoutPassword);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Profile fetch error:', error);
    return apiError('Failed to fetch profile', 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await req.json();
    const allowedFields = ['name', 'phone', 'institution', 'hscYear', 'bio', 'image'];
    const updateData: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return apiError('No valid fields to update', 400);
    }

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: updateData,
    });

    const { password, ...userWithoutPassword } = updatedUser;

    return apiSuccess(userWithoutPassword);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Profile update error:', error);
    return apiError('Failed to update profile', 500);
  }
}
