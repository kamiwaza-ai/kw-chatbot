//lib/auth/auth.ts

import { removeAuthCookie } from './cookies';
import type { KamiwazaUser } from './types';

export async function signOut() {
  // Call the logout endpoint
  await fetch('/api/auth/logout', { method: 'POST' });
  // Clean up cookies
  await removeAuthCookie();
}

// Re-export types
export type { KamiwazaUser }; 