import { NextRequest } from 'next/server';
import { db } from '@ris-academy/db';
import { apiSuccess, apiError, requireAuth, AuthError } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();

    const { searchParams } = req.nextUrl;
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const where: Record<string, unknown> = { userId: user.id };
    if (unreadOnly) {
      where.read = false;
    }

    const notifications = await db.notification.findMany({
      where: where as any,
      orderBy: { createdAt: 'desc' },
    });

    return apiSuccess(notifications);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Notifications error:', error);
    return apiError('Failed to fetch notifications', 500);
  }
}
