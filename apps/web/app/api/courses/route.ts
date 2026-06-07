import { NextRequest } from 'next/server';
import { db } from '@ris-academy/db';
import { apiError, apiPaginated } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const subject = searchParams.get('subject');
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get('limit') || '12', 10)));

    const where: Record<string, unknown> = { isPublished: true };

    if (subject) {
      where.subject = subject;
    }

    if (type && (type === 'FREE' || type === 'PAID')) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [courses, total] = await Promise.all([
      db.course.findMany({
        where: where as any,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          description: true,
          thumbnail: true,
          subject: true,
          type: true,
          price: true,
          instructorName: true,
          instructorBio: true,
          createdAt: true,
          _count: { select: { enrollments: true, chapters: true } },
        },
      }),
      db.course.count({ where: where as any }),
    ]);

    return apiPaginated(courses, total, page, limit);
  } catch (error) {
    console.error('Courses list error:', error);
    return apiError('Failed to fetch courses', 500);
  }
}
