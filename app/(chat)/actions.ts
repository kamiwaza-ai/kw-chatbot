'use server';

import { type CoreUserMessage, generateText } from 'ai';
import { cookies } from 'next/headers';

import { customModel } from '@/lib/ai';
import { getValidModelId, models, initializeModels } from '@/lib/ai/models';
import {
  deleteMessagesByChatIdAfterTimestamp,
  getMessageById,
  updateChatVisiblityById,
} from '@/lib/db/queries';
import { VisibilityType } from '@/components/visibility-selector';

export async function generateTitleFromUserMessage({
  message,
}: {
  message: CoreUserMessage;
}) {
  // Ensure models are initialized
  if (models.length === 0) {
    await initializeModels();
  }

  const cookieStore = await cookies();
  const modelId = getValidModelId(cookieStore.get('model-id')?.value);
  
  // Find the model by ID and use its label
  const model = models.find(m => m.id === modelId);
  if (!model) throw new Error(`Model ${modelId} not found`);
  
  const wrappedModel = await customModel(model.label);
  const { text: title } = await generateText({
    model: wrappedModel,
    system: `\n
    - you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    - the title should be a summary of the user's message
    - do not use quotes or colons`,
    prompt: JSON.stringify(message),
  });

  return title;
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  const [message] = await getMessageById({ id });

  await deleteMessagesByChatIdAfterTimestamp({
    chatId: message.chatId,
    timestamp: message.createdAt,
  });
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  await updateChatVisiblityById({ chatId, visibility });
}
