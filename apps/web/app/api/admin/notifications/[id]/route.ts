import { NextRequest } from 'next/server';
import { db } from '@ris-academy/db';
import { apiSuccess, apiError, requireAdmin, AuthError } from '@/lib/api-utils';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();

    const existing = await db.notification.findUnique({ where: { id: params.id } });
    if (!existing) return apiError('Notification not found', 404);

    await db.notification.delete({ where: { id: params.id } });

    return apiSuccess({ deleted: true });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Admin notifications delete error:', error);
    return apiError('Failed to delete notification', 500);
  }
}
