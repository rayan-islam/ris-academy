import { NextRequest } from 'next/server';
import { db } from '@ris-academy/db';
import { apiSuccess, apiError, requireAdmin, AuthError } from '@/lib/api-utils';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin();

    const exam = await db.exam.findUnique({
      where: { id: params.id },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!exam) return apiError('Exam not found', 404);

    return apiSuccess(exam);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Admin exam detail error:', error);
    return apiError('Failed to fetch exam', 500);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin();

    const body = await req.json();
    const { title, description, subject, chapter, examType, totalMarks, passPercentage, timeLimit, negativeMarking, allowRetake, instructions, isPublished, courseId } = body;

    const existing = await db.exam.findUnique({ where: { id: params.id } });
    if (!existing) return apiError('Exam not found', 404);

    const exam = await db.exam.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(subject !== undefined && { subject }),
        ...(chapter !== undefined && { chapter }),
        ...(examType !== undefined && { examType }),
        ...(totalMarks !== undefined && { totalMarks }),
        ...(passPercentage !== undefined && { passPercentage }),
        ...(timeLimit !== undefined && { timeLimit }),
        ...(negativeMarking !== undefined && { negativeMarking }),
        ...(allowRetake !== undefined && { allowRetake }),
        ...(instructions !== undefined && { instructions }),
        ...(isPublished !== undefined && { isPublished }),
        ...(courseId !== undefined && { courseId }),
      },
    });

    return apiSuccess(exam);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Admin update exam error:', error);
    return apiError('Failed to update exam', 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin();

    const body = await req.json();
    const existing = await db.exam.findUnique({ where: { id: params.id } });
    if (!existing) return apiError('Exam not found', 404);

    const exam = await db.exam.update({
      where: { id: params.id },
      data: {
        ...(body.isPublished !== undefined && { isPublished: body.isPublished }),
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.subject !== undefined && { subject: body.subject }),
        ...(body.chapter !== undefined && { chapter: body.chapter }),
        ...(body.examType !== undefined && { examType: body.examType }),
        ...(body.totalMarks !== undefined && { totalMarks: body.totalMarks }),
        ...(body.passPercentage !== undefined && { passPercentage: body.passPercentage }),
        ...(body.timeLimit !== undefined && { timeLimit: body.timeLimit }),
        ...(body.negativeMarking !== undefined && { negativeMarking: body.negativeMarking }),
        ...(body.allowRetake !== undefined && { allowRetake: body.allowRetake }),
        ...(body.instructions !== undefined && { instructions: body.instructions }),
        ...(body.courseId !== undefined && { courseId: body.courseId }),
      },
    });

    return apiSuccess(exam);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Admin patch exam error:', error);
    return apiError('Failed to update exam', 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin();

    const existing = await db.exam.findUnique({ where: { id: params.id } });
    if (!existing) return apiError('Exam not found', 404);

    await db.exam.delete({ where: { id: params.id } });

    return apiSuccess({ message: 'Exam deleted' });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Admin delete exam error:', error);
    return apiError('Failed to delete exam', 500);
  }
}
