import { db } from '@/lib/db';
import { and, eq } from 'drizzle-orm';
import { customModelEndpoint } from '@/lib/db/schema';
import { verifyKamiwazaToken } from '@/lib/auth/kamiwaza';
import { getUserByKamiwazaId } from '@/lib/db/queries';
import { parseAuthHeader } from '@/lib/auth/cookies';
import { getSession } from '@/lib/auth/session';

async function listCustomModelEndpoints(userId: string) {
  return await db.select().from(customModelEndpoint).where(
    and(
      eq(customModelEndpoint.userId, userId),
      eq(customModelEndpoint.isActive, true)
    )
  );
}

async function createCustomModelEndpoint({
  name,
  uri,
  apiKey,
  providerType,
  userId,
}: {
  name: string;
  uri: string;
  apiKey?: string;
  providerType: string;
  userId: string;
}) {
  const [endpoint] = await db
    .insert(customModelEndpoint)
    .values({
      name,
      uri,
      apiKey,
      providerType,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
  return endpoint;
}

export async function GET(request: Request) {
  console.log('Model endpoints GET request received');
  
  // Get token from Authorization header
  const authHeader = request.headers.get('Authorization') || undefined;
  const token = parseAuthHeader(authHeader);
  
  if (!token) {
    console.log('No auth token found in header');
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Verify token with Kamiwaza
    const kamiwazaUser = await verifyKamiwazaToken(token);
    console.log('User authenticated:', kamiwazaUser.id);
    
    // Get database user
    const dbUser = await getUserByKamiwazaId(kamiwazaUser.id);
    if (!dbUser) {
      console.log('No database user found');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get custom endpoints for user
    const endpoints = await listCustomModelEndpoints(dbUser.id);
    console.log('Found endpoints:', endpoints);
    
    return Response.json(endpoints);
  } catch (error) {
    console.error('Failed to list model endpoints:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, uri, apiKey } = body;

    if (!name || !uri) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const endpoint = await createCustomModelEndpoint({
      name,
      uri,
      apiKey,
      providerType: 'openai-compatible',
      userId: session.user.dbId
    });

    return Response.json(endpoint);
  } catch (error) {
    console.error('Failed to create model endpoint:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 