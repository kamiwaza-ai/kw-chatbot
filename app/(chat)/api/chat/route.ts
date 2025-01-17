// app/(chat)/api/chat/route.ts

import {
  type Message,
  convertToCoreMessages,
  createDataStreamResponse,
  streamObject,
  streamText,
  experimental_wrapLanguageModel as wrapLanguageModel,
} from 'ai';
import { z } from 'zod';

import { getSession } from '@/lib/auth/session';
import { models, initializeModels, createKamiwazaProvider } from '@/lib/ai/models';
import { customMiddleware } from '@/lib/ai/custom-middleware';
import {
  codePrompt,
  systemPrompt,
  updateDocumentPrompt,
} from '@/lib/ai/prompts';
import {
  deleteChatById,
  getChatById,
  getDocumentById,
  saveChat,
  saveDocument,
  saveMessages,
} from '@/lib/db/queries';
import {
  generateUUID,
  getMostRecentUserMessage,
} from '@/lib/utils';

import { generateTitleFromUserMessage } from '../../actions';

export const maxDuration = 60;

type AllowedTools =
  | 'createDocument'
  | 'updateDocument'
  | 'getWeather';

const blocksTools: AllowedTools[] = [
  'createDocument',
  'updateDocument',
];

const weatherTools: AllowedTools[] = ['getWeather'];

const allTools: AllowedTools[] = [...blocksTools, ...weatherTools];

export async function POST(request: Request) {
  console.log('Chat API called');
  // Ensure models are initialized
  if (models.length === 0) {
    await initializeModels();
  }

  const {
    id,
    messages,
    modelId,
  }: { id: string; messages: Array<Message>; modelId: string } =
    await request.json();
  
  console.log('Request payload:', { id, messages, modelId });

  const session = await getSession();

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const model = models.find((model) => model.id === modelId);
  console.log('Found model:', model);

  if (!model) {
    return new Response('Model not found', { status: 404 });
  }

  // Create Kamiwaza provider if deployment info exists
  let wrappedModel;
  if (model.deployment) {
    const provider = createKamiwazaProvider(model.deployment.lb_port);
    wrappedModel = wrapLanguageModel({
      model: provider('model'),
      middleware: customMiddleware,
    });
  } else {
    return new Response('Model deployment not found', { status: 404 });
  }

  const coreMessages = convertToCoreMessages(messages);
  const userMessage = getMostRecentUserMessage(coreMessages);

  if (!userMessage) {
    return new Response('No user message found', { status: 400 });
  }

  const chat = await getChatById({ id });

  if (!chat) {
    const title = await generateTitleFromUserMessage({ message: userMessage });
    await saveChat({ id, userId: session.user.dbId, title });
  }

  const userMessageId = generateUUID();

  await saveMessages({
    messages: [
      { ...userMessage, id: userMessageId, createdAt: new Date(), chatId: id },
    ],
  });

  return createDataStreamResponse({
    execute: (dataStream) => {
      dataStream.writeData({
        type: 'user-message-id',
        content: userMessageId,
      });

      const result = streamText({
        model: wrappedModel,
        system: systemPrompt,
        messages: coreMessages,
        maxSteps: 5,
        experimental_activeTools: allTools,
        onFinish: async ({ response }) => {
          await saveMessages({
            messages: [{
              role: 'assistant',
              content: response.messages[response.messages.length - 1].content,
              id: generateUUID(),
              createdAt: new Date(),
              chatId: id
            }]
          });
        }
      });

      result.mergeIntoDataStream(dataStream);
    }
  });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Missing id', { status: 400 });
  }

  const session = await getSession();

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  await deleteChatById({ id });

  return new Response('OK');
}
