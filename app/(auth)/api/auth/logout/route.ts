// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';
import { removeAuthCookie } from '@/lib/auth/cookies';

export async function POST() {
  removeAuthCookie();
  return NextResponse.json({ success: true });
}