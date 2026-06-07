import { NextRequest } from 'next/server';
import { db } from '@ris-academy/db';
import { apiSuccess, apiError, requireAuth, AuthError } from '@/lib/api-utils';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireAuth();

    const attempt = await db.examAttempt.findUnique({
      where: { userId_examId: { userId: user.id, examId: params.id } },
    });

    if (!attempt || attempt.status !== 'IN_PROGRESS') {
      return apiError('No active exam attempt found', 404);
    }

    const updated = await db.examAttempt.update({
      where: { id: attempt.id },
      data: { tabSwitches: { increment: 1 } },
    });

    const warningThreshold = 3;
    const switchCount = updated.tabSwitches;
    let warning: string | null = null;

    if (switchCount >= warningThreshold) {
      if (switchCount === warningThreshold) {
        warning = `Warning: ${switchCount} tab switches detected. Further switches may lead to exam submission.`;
      } else {
        warning = `Warning: ${switchCount} tab switches detected. This may affect your exam integrity.`;
      }
    }

    return apiSuccess({
      tabSwitches: switchCount,
      warning,
    });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Tab switch error:', error);
    return apiError('Failed to log tab switch', 500);
  }
}
