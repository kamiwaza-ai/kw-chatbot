// lib/auth/session.ts
import { getAuthCookie } from './cookies';
import { verifyKamiwazaToken } from './kamiwaza';
import type { KamiwazaUser } from './types';
import { getUserByKamiwazaId } from '@/lib/db/queries';

export interface Session {
  user: (KamiwazaUser & { dbId: string }) | null;
}

export async function getSession(): Promise<Session | null> {
  const token = await getAuthCookie();
  
  if (!token) {
    return null;
  }

  try {
    const kamiwazaUser = await verifyKamiwazaToken(token);
    // Get our database user
    const dbUser = await getUserByKamiwazaId(kamiwazaUser.id);
    
    if (!dbUser) {
      return null;
    }

    // Return both Kamiwaza user info and our database ID
    return { 
      user: {
        ...kamiwazaUser,
        dbId: dbUser.id
      }
    };
  } catch (error) {
    return null;
  }
}