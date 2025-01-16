// components/messages.tsx
'use client';

import { Message, ChatRequestOptions } from 'ai';
import { useMemo } from 'react';
import { Vote } from '@/lib/db/schema';
import { cn } from '@/lib/utils';
import { PreviewMessage, ThinkingMessage } from './message';

function MessagesComponent({
  chatId,
  messages,
  votes,
  isLoading,
  setMessages,
  reload,
  isReadonly,
  isBlockVisible,
}: {
  chatId: string;
  messages: Array<Message>;
  votes: Array<Vote> | undefined;
  isLoading: boolean;
  setMessages: (messages: Message[] | ((messages: Message[]) => Message[])) => void;
  reload: (chatRequestOptions?: ChatRequestOptions) => Promise<string | undefined>;
  isReadonly: boolean;
  isBlockVisible: boolean;
}) {
  console.log('🔍 Messages props:', { 
    messageCount: messages.length, 
    messages,
    isLoading,
    isBlockVisible
  });

  const lastMessageRole = messages[messages.length - 1]?.role;
  console.log('🎭 Messages component rendering with:', {
    messages,
    isLoading,
    lastMessageRole,
  });

  const shouldShowThinking = useMemo(() => {
    const result = isLoading && lastMessageRole === 'user';
    console.log('💭 Thinking state:', {
      shouldShowThinking: result,
      isLoading,
      lastMessageRole,
    });
    return result;
  }, [isLoading, lastMessageRole]);

  return (
    <div
      className={cn(
        'flex-1 overflow-y-auto pt-4 md:pt-10',
        isBlockVisible && 'pb-[50vh]',
      )}
    >
      <div className="flex flex-col gap-6">
        {messages.map((message) => {
          console.log('📜 Rendering message:', message);
          const vote = votes?.find((vote) => vote.messageId === message.id);

          return (
            <PreviewMessage
              key={message.id}
              chatId={chatId}
              message={message}
              vote={vote}
              isLoading={isLoading}
              setMessages={setMessages}
              reload={reload}
              isReadonly={isReadonly}
            />
          );
        })}

        {shouldShowThinking && <ThinkingMessage />}
      </div>
    </div>
  );
}

export const Messages = MessagesComponent;
