import { NextResponse } from 'next/server';

export function apiSuccess(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(message: string, status: number, details?: unknown) {
  const body: Record<string, unknown> = { error: message };
  if (process.env.NODE_ENV === 'development' && details) {
    body.detail = details instanceof Error ? details.message : details;
  }
  return NextResponse.json(body, { status });
}
