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
import { models, initializeModels, createKamiwazaProvider, createOpenAICompatible } from '@/lib/ai/models';
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
import { getAuthCookie } from '@/lib/auth/cookies';

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
  
  const session = await getSession();
  console.log('Session state:', {
    exists: !!session,
    hasUser: !!session?.user,
    userId: session?.user?.dbId
  });

  if (!session || !session.user) {
    console.log('Unauthorized: No valid session');
    return new Response('Unauthorized', { status: 401 });
  }

  // Get auth token
  const token = await getAuthCookie();
  if (!token) {
    console.log('No auth token found');
    return new Response('Unauthorized', { status: 401 });
  }

  // Ensure models are initialized with user session and token
  console.log('Initializing models with user:', session.user.dbId);
  try {
    if (models.length === 0) {
      await initializeModels(session.user.dbId, token);
    }
    console.log('Available models after initialization:', models);
  } catch (error) {
    console.error('Error initializing models:', error);
    return new Response('Failed to initialize models', { status: 500 });
  }

  const {
    id,
    messages,
    modelId,
  }: { id: string; messages: Array<Message>; modelId: string } =
    await request.json();
  
  console.log('Request payload:', { id, messages, modelId });

  const model = models.find((model) => model.id === modelId);
  console.log('Found model:', model);

  if (!model) {
    console.log('Model not found in available models:', {
      requestedId: modelId,
      availableIds: models.map(m => m.id)
    });
    return new Response('Model not found', { status: 404 });
  }

  // Create provider based on model type
  let wrappedModel;
  try {
    if (model.type === 'kamiwaza' && model.deployment) {
      console.log('Creating Kamiwaza provider:', {
        port: model.deployment.lb_port,
        baseUrl: process.env.NEXT_PUBLIC_KAMIWAZA_URI
      });
      const provider = createKamiwazaProvider(model.deployment.lb_port);
      wrappedModel = wrapLanguageModel({
        model: provider('model'),
        middleware: customMiddleware,
      });
    } else if (model.type === 'custom' && model.uri) {
      console.log('Creating custom provider:', {
        uri: model.uri,
        hasApiKey: !!model.apiKey
      });
      const provider = createOpenAICompatible({
        name: 'model',
        baseURL: model.uri,
        headers: {
          'Content-Type': 'application/json',
          ...(model.apiKey && { 'Authorization': `Bearer ${model.apiKey}` })
        }
      });
      wrappedModel = wrapLanguageModel({
        model: provider('model'),
        middleware: customMiddleware,
      });
      console.log('Custom provider created successfully');
    } else {
      console.log('Invalid model configuration:', model);
      return new Response('Invalid model configuration', { status: 400 });
    }
  } catch (error) {
    console.error('Error creating provider:', error);
    return new Response('Failed to create provider', { status: 500 });
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
