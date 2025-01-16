// app/(chat)/api/history/route.ts

import { getSession } from '@/lib/auth/session';
import { getChatsByUserId } from '@/lib/db/queries';

export async function GET() {
  const session = await getSession();

  if (!session || !session.user) {
    return Response.json('Unauthorized!', { status: 401 });
  }

  const chats = await getChatsByUserId({ id: session.user.id });
  return Response.json(chats);
}
