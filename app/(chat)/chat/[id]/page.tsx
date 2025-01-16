// app/(chat)/chat/[id]/page.tsx

import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { getSession } from '@/lib/auth/session';
import { Chat } from '@/components/chat';
import { getValidModelId, initializeModels, models } from '@/lib/ai/models';
import { getChatById, getMessagesByChatId } from '@/lib/db/queries';
import { convertToUIMessages } from '@/lib/utils';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const chat = await getChatById({ id });

  if (!chat) {
    notFound();
  }

  const session = await getSession();

  if (chat.visibility === 'private') {
    if (!session || !session.user) {
      return notFound();
    }

    if (session.user.dbId !== chat.userId) {
      return notFound();
    }
  }

  const messagesFromDb = await getMessagesByChatId({
    id,
  });

  // Ensure models are initialized
  if (models.length === 0) {
    await initializeModels();
  }

  const cookieStore = await cookies();
  const selectedModelId = getValidModelId(cookieStore.get('model-id')?.value);

  return (
    <Chat
      id={chat.id}
      initialMessages={convertToUIMessages(messagesFromDb)}
      selectedModelId={selectedModelId}
      selectedVisibilityType={chat.visibility}
      isReadonly={session?.user?.dbId !== chat.userId}
    />
  );
}
