import { getSession } from '@/lib/auth/session';

export async function GET() {
  const session = await getSession();
  return Response.json(session);
} 