import { NextRequest } from 'next/server';
import { db } from '@ris-academy/db';
import { apiSuccess, apiError, apiPaginated, requireAdmin, AuthError } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const subject = searchParams.get('subject') || '';
    const chapter = searchParams.get('chapter') || '';
    const difficulty = searchParams.get('difficulty') || '';
    const source = searchParams.get('source') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { stem: { contains: search, mode: 'insensitive' } },
        { chapter: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (subject) where.subject = subject;
    if (chapter) where.chapter = chapter;
    if (difficulty) where.difficulty = difficulty;
    if (source) where.source = source;

    const [questions, total] = await Promise.all([
      db.questionBank.findMany({
        where: where as any,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.questionBank.count({ where: where as any }),
    ]);

    return apiPaginated(questions, total, page, limit);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Question Bank list error:', error);
    return apiError('Failed to fetch question bank', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json();
    const { stem, optionA, optionB, optionC, optionD, correctAnswer, explanation, difficulty, subject, chapter } = body;

    if (!stem || !optionA || !optionB || !optionC || !optionD || !correctAnswer || !difficulty || !subject) {
      return apiError('Missing required fields: stem, options, correctAnswer, difficulty, subject', 422);
    }

    const question = await db.questionBank.create({
      data: {
        stem,
        optionA,
        optionB,
        optionC,
        optionD,
        correctAnswer,
        explanation: explanation || null,
        difficulty,
        subject,
        chapter: chapter || null,
        source: 'manual',
      },
    });

    return apiSuccess(question, 201);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Question Bank create error:', error);
    return apiError('Failed to create question', 500);
  }
}
