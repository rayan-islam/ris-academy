import { NextRequest } from 'next/server';
import { db } from '@ris-academy/db';
import { apiSuccess, apiError, requireAuth, AuthError } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();

    const certificates = await db.certificate.findMany({
      where: { userId: user.id },
      include: {
        course: {
          select: { title: true },
        },
      },
      orderBy: { issuedAt: 'desc' },
    });

    return apiSuccess(
      certificates.map((c) => ({
        id: c.id,
        courseName: c.course.title,
        certificateNumber: c.certificateNumber,
        pdfUrl: c.pdfUrl,
        issuedAt: c.issuedAt,
      })),
    );
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Certificates error:', error);
    return apiError('Failed to fetch certificates', 500);
  }
}
