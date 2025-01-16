// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getKamiwazaToken } from '@/lib/auth/kamiwaza';
import { setAuthCookie } from '@/lib/auth/cookies';
import { createOrUpdateUser } from '@/lib/db/queries';

export async function POST(request: NextRequest) {
  console.log('🟢 API: Login request received');
  try {
    const { username, password } = await request.json();
    console.log('🟢 API: Parsed credentials', { username });

    // Get token from Kamiwaza
    console.log('🟢 API: Getting Kamiwaza token...');
    const { access_token } = await getKamiwazaToken(username, password);
    console.log('🟢 API: Got Kamiwaza token');

    // Verify token and get user info
    console.log('🟢 API: Getting user info...');
    const userData = await getCurrentUser(access_token);
    console.log('🟢 API: Got user info', { email: userData.email, id: userData.id });

    // Create or update local user record
    console.log('🟢 API: Creating/updating user record...');
    await createOrUpdateUser({
      email: userData.email,
      kamiwazaId: userData.id,
    });
    console.log('🟢 API: User record updated');

    // Set the auth cookie
    console.log('🟢 API: Setting auth cookie...');
    await setAuthCookie(access_token);
    console.log('🟢 API: Auth cookie set');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('🔴 API: Login error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    );
  }
}