// lib/auth/kamiwaza.ts
import { KamiwazaTokenResponse, KamiwazaUser } from './types';

const KAMIWAZA_URI = process.env.KAMIWAZA_URI;

if (!KAMIWAZA_URI) {
  throw new Error('KAMIWAZA_URI environment variable is not set');
}

console.log('🔷 Kamiwaza: Initialized with URI:', KAMIWAZA_URI);

// Configure fetch options to handle self-signed certificates in development
const fetchOptions = {
  // @ts-ignore - Next.js specific configuration
  next: {
    revalidate: 0,
  }
};

export async function getKamiwazaToken(username: string, password: string): Promise<KamiwazaTokenResponse> {
  const url = `${KAMIWAZA_URI}/auth/token`;
  console.log('🔷 Kamiwaza: Getting token from:', url);
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'password',
        username,
        password,
        scope: '',
        client_id: 'string',
        client_secret: 'string'
      }),
    });

    console.log('🔷 Kamiwaza: Token response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔴 Kamiwaza: Authentication failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error('Authentication failed');
    }

    const data = await response.json();
    console.log('🔷 Kamiwaza: Token received successfully');
    return data;
  } catch (error) {
    console.error('🔴 Kamiwaza: Error getting token:', error);
    throw error;
  }
}

export async function verifyKamiwazaToken(token: string): Promise<KamiwazaUser> {
  const url = `${KAMIWAZA_URI}/auth/verify-token`;
  console.log('🔷 Kamiwaza: Verifying token at:', url);
  console.log('🔷 Kamiwaza: Using token:', token.substring(0, 10) + '...');
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        'accept': 'application/json',
        'Cookie': `access_token=${token}`
      },
    });

    console.log('🔷 Kamiwaza: Verify response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔴 Kamiwaza: Token verification failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error('Token verification failed');
    }

    const data = await response.json();
    console.log('🔷 Kamiwaza: Token verified successfully');
    return data;
  } catch (error) {
    console.error('🔴 Kamiwaza: Error verifying token:', error);
    throw error;
  }
}

export async function getCurrentUser(token: string): Promise<KamiwazaUser> {
  const url = `${KAMIWAZA_URI}/auth/users/me`;
  console.log('🔷 Kamiwaza: Getting user info from:', url);
  console.log('🔷 Kamiwaza: Using token:', token.substring(0, 10) + '...');
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        'accept': 'application/json',
        'Cookie': `access_token=${token}`
      },
    });

    console.log('🔷 Kamiwaza: User info response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔴 Kamiwaza: Failed to fetch user data:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error('Failed to fetch user data');
    }

    const data = await response.json();
    console.log('🔷 Kamiwaza: User info received successfully');
    return data;
  } catch (error) {
    console.error('🔴 Kamiwaza: Error getting user info:', error);
    throw error;
  }
}