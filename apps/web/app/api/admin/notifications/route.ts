import { NextRequest } from 'next/server';
import { db } from '@ris-academy/db';
import { apiSuccess, apiError, apiPaginated, requireAdmin, AuthError } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || '';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};

    if (type) where.type = type;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [notifications, total] = await Promise.all([
      db.notification.findMany({
        where: where as any,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { name: true, email: true } },
        },
      }),
      db.notification.count({ where: where as any }),
    ]);

    return apiPaginated(notifications, total, page, limit);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Admin notifications list error:', error);
    return apiError('Failed to fetch notifications', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json();
    const { userIds, title, message, type, link } = body;

    if (!title || !message || !type) {
      return apiError('Missing required fields: title, message, type', 422);
    }

    let targetUserIds: string[] = [];

    if (userIds && userIds.length > 0) {
      targetUserIds = userIds;
    } else {
      const allUsers = await db.user.findMany({
        where: { isActive: true },
        select: { id: true },
      });
      targetUserIds = allUsers.map((u) => u.id);
    }

    const notifications = await Promise.all(
      targetUserIds.map((userId) =>
        db.notification.create({
          data: {
            userId,
            title,
            message,
            type,
            link: link || null,
          },
        })
      )
    );

    return apiSuccess(
      { count: notifications.length, broadcast: !userIds || userIds.length === 0 },
      201
    );
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Admin notifications create error:', error);
    return apiError('Failed to create notifications', 500);
  }
}
