// lib/db/queries.ts

import 'server-only';

import { genSaltSync, hashSync } from 'bcrypt-ts';
import { and, asc, desc, eq, gt, gte } from 'drizzle-orm';
import { db } from './index';
import {
  user,
  chat,
  type User,
  document,
  type Suggestion,
  suggestion,
  type Message,
  message,
  vote,
  customModelEndpoint,
  type CustomModelEndpoint,
} from './schema';
import { BlockKind } from '@/components/block';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

export async function getUserByKamiwazaId(kamiwazaId: string): Promise<User | undefined> {
  try {
    const [existingUser] = await db
      .select()
      .from(user)
      .where(eq(user.kamiwaza_id, kamiwazaId));
    return existingUser;
  } catch (error) {
    console.error('Failed to get user by Kamiwaza ID from database');
    throw error;
  }
}

export async function createOrUpdateUser({
  email,
  kamiwazaId,
}: {
  email: string;
  kamiwazaId: string;
}): Promise<User> {
  try {
    const existingUser = await getUserByKamiwazaId(kamiwazaId);
    
    if (existingUser) {
      // Update last login time
      const [updatedUser] = await db
        .update(user)
        .set({ last_login: new Date() })
        .where(eq(user.kamiwaza_id, kamiwazaId))
        .returning();
      return updatedUser;
    }

    // Create new user
    const [newUser] = await db
      .insert(user)
      .values({
        email,
        kamiwaza_id: kamiwazaId,
        last_login: new Date(),
      })
      .returning();

    return newUser;
  } catch (error) {
    console.error('Failed to create/update user in database');
    throw error;
  }
}

export async function saveChat({
  id,
  userId,
  title,
}: {
  id: string;
  userId: string;
  title: string;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
    });
  } catch (error) {
    console.error('Failed to save chat in database');
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));

    return await db.delete(chat).where(eq(chat.id, id));
  } catch (error) {
    console.error('Failed to delete chat by id from database');
    throw error;
  }
}

export async function getChatsByUserId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(chat)
      .where(eq(chat.userId, id))
      .orderBy(desc(chat.createdAt));
  } catch (error) {
    console.error('Failed to get chats by user from database');
    throw error;
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    console.error('Failed to get chat by id from database');
    throw error;
  }
}

export async function saveMessages({ messages }: { messages: Array<Message> }) {
  try {
    return await db.insert(message).values(messages);
  } catch (error) {
    console.error('Failed to save messages in database', error);
    throw error;
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    console.error('Failed to get messages by chat id from database', error);
    throw error;
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === 'up' })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === 'up',
    });
  } catch (error) {
    console.error('Failed to upvote message in database', error);
    throw error;
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    console.error('Failed to get votes by chat id from database', error);
    throw error;
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: BlockKind;
  content: string;
  userId: string;
}) {
  try {
    return await db.insert(document).values({
      id,
      title,
      kind,
      content,
      userId,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to save document in database');
    throw error;
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp),
        ),
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)));
  } catch (error) {
    console.error(
      'Failed to delete documents by id after timestamp from database',
    );
    throw error;
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    console.error('Failed to save suggestions in database');
    throw error;
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (error) {
    console.error(
      'Failed to get suggestions by document version from database',
    );
    throw error;
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (error) {
    console.error('Failed to get message by id from database');
    throw error;
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    return await db
      .delete(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)),
      );
  } catch (error) {
    console.error(
      'Failed to delete messages by id after timestamp from database',
    );
    throw error;
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (error) {
    console.error('Failed to update chat visibility in database');
    throw error;
  }
}

// Custom Model Endpoint Queries
export async function createCustomModelEndpoint({
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
}): Promise<CustomModelEndpoint> {
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

export async function listCustomModelEndpoints(userId: string): Promise<CustomModelEndpoint[]> {
  return db
    .select()
    .from(customModelEndpoint)
    .where(and(
      eq(customModelEndpoint.userId, userId),
      eq(customModelEndpoint.isActive, true)
    ));
}

export async function getCustomModelEndpointById(id: string): Promise<CustomModelEndpoint | undefined> {
  const [endpoint] = await db
    .select()
    .from(customModelEndpoint)
    .where(eq(customModelEndpoint.id, id));
  return endpoint;
}

export async function updateCustomModelEndpoint({
  id,
  name,
  uri,
  apiKey,
  providerType,
  isActive,
}: {
  id: string;
  name?: string;
  uri?: string;
  apiKey?: string;
  providerType?: string;
  isActive?: boolean;
}): Promise<CustomModelEndpoint | undefined> {
  const updates: Partial<CustomModelEndpoint> = {
    updatedAt: new Date(),
  };
  
  if (name !== undefined) updates.name = name;
  if (uri !== undefined) updates.uri = uri;
  if (apiKey !== undefined) updates.apiKey = apiKey;
  if (providerType !== undefined) updates.providerType = providerType;
  if (isActive !== undefined) updates.isActive = isActive;

  const [updated] = await db
    .update(customModelEndpoint)
    .set(updates)
    .where(eq(customModelEndpoint.id, id))
    .returning();
  
  return updated;
}

export async function deleteCustomModelEndpoint(id: string): Promise<void> {
  await db
    .update(customModelEndpoint)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(customModelEndpoint.id, id));
}
