import { NextRequest } from 'next/server';
import { db } from '@ris-academy/db';
import { apiSuccess, apiError, requireAuth, AuthError } from '@/lib/api-utils';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireAuth();

    const notification = await db.notification.findUnique({
      where: { id: params.id },
    });

    if (!notification) {
      return apiError('Notification not found', 404);
    }

    if (notification.userId !== user.id) {
      return apiError('Unauthorized', 403);
    }

    const updated = await db.notification.update({
      where: { id: params.id },
      data: { read: true },
    });

    return apiSuccess(updated);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Mark read error:', error);
    return apiError('Failed to mark notification as read', 500);
  }
}
