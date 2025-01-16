// lib/auth/session.ts
import { getAuthCookie } from './cookies';
import { verifyKamiwazaToken } from './kamiwaza';
import type { KamiwazaUser } from './types';

export interface Session {
  user: KamiwazaUser | null;
}

export async function getSession(): Promise<Session | null> {
  const token = await getAuthCookie();
  
  if (!token) {
    return null;
  }

  try {
    const user = await verifyKamiwazaToken(token);
    return { user };
  } catch (error) {
    return null;
  }
}