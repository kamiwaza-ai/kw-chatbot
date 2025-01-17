// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';
import { removeAuthCookie } from '@/lib/auth/cookies';

export async function POST() {
  await removeAuthCookie();
  return NextResponse.json({ success: true, message: 'Logged out successfully' });
}