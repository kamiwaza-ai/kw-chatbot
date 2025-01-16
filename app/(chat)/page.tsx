// app/(chat)/page.tsx

import { cookies } from 'next/headers';

import { Chat } from '@/components/chat';
import { getValidModelId, initializeModels, models } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';

export default async function Page() {
  const id = generateUUID();

  // Ensure models are initialized
  if (models.length === 0) {
    await initializeModels();
  }

  const cookieStore = await cookies();
  const selectedModelId = getValidModelId(cookieStore.get('model-id')?.value);

  return (
    <>
      <Chat
        key={id}
        id={id}
        initialMessages={[]}
        selectedModelId={selectedModelId}
        selectedVisibilityType="private"
        isReadonly={false}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
