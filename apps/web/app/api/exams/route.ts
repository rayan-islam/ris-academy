import { NextRequest } from 'next/server';
import { db } from '@ris-academy/db';
import { apiSuccess, apiError } from '@/lib/api-utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  const user = await db.user.findUnique({ where: { email: session.user.email } });
  return user;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError('Authentication required', 401);
    }

    const { searchParams } = req.nextUrl;
    const subject = searchParams.get('subject');

    const where: Record<string, unknown> = { isPublished: true };
    if (subject) {
      where.subject = subject;
    }

    const exams = await db.exam.findMany({
      where: where as any,
      orderBy: { createdAt: 'desc' },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            stem: true,
            optionA: true,
            optionB: true,
            optionC: true,
            optionD: true,
            difficulty: true,
            marks: true,
            order: true,
          },
        },
        _count: { select: { questions: true, attempts: true } },
      },
    });

    return apiSuccess(exams);
  } catch (error) {
    console.error('Exams list error:', error);
    return apiError('Failed to fetch exams', 500);
  }
}
