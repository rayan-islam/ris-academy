import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@ris-academy/db';
import type { User } from '@prisma/client';

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function apiPaginated<T>(data: T[], total: number, page: number, limit: number) {
  return NextResponse.json({
    success: true,
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
    this.name = 'AuthError';
  }
}

export async function requireAdmin(): Promise<User> {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new AuthError('Unauthorized', 401);
  const user = await db.user.findUnique({ where: { email: session.user.email! } });
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    throw new AuthError('Forbidden', 403);
  }
  return user;
}

export async function requireStaff(): Promise<User> {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new AuthError('Unauthorized', 401);
  const user = await db.user.findUnique({ where: { email: session.user.email! } });
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'MODERATOR' && user.role !== 'TEACHER')) {
    throw new AuthError('Forbidden', 403);
  }
  return user;
}

export async function requireAuth(): Promise<User> {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new AuthError('Unauthorized', 401);
  const user = await db.user.findUnique({ where: { email: session.user.email! } });
  if (!user) throw new AuthError('Unauthorized', 401);
  return user;
}
