// components/chat.tsx

'use client';

import type { Attachment, Message } from 'ai';
import { useChat } from 'ai/react';
import { useState, useEffect, useRef } from 'react';
import useSWR, { useSWRConfig } from 'swr';

import { ChatHeader } from '@/components/chat-header';
import type { Vote } from '@/lib/db/schema';
import { fetcher } from '@/lib/utils';

import { Block } from './block';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import { VisibilityType } from './visibility-selector';
import { useBlockSelector } from '@/hooks/use-block';
import { DataStreamHandler } from './data-stream-handler';

export function Chat({
  id,
  initialMessages,
  selectedModelId,
  selectedVisibilityType,
  isReadonly,
}: {
  id: string;
  initialMessages: Array<Message>;
  selectedModelId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const { mutate } = useSWRConfig();
  const [currentModelId, setCurrentModelId] = useState(selectedModelId);

  const {
    messages: chatMessages,
    setMessages,
    data: dataStream,
    handleSubmit,
    input,
    setInput,
    append,
    isLoading,
    stop,
    reload,
  } = useChat({
    id,
    body: { id, modelId: currentModelId },
    initialMessages,
    experimental_throttle: 0,
    onResponse: (response) => {
      console.log('🔄 Chat response headers:', {
        contentType: response.headers.get('content-type'),
        status: response.status
      });
      // Reset stream state on new responses
      streamContent.current = '';
      streamMessageId.current = 'streaming-' + Date.now();
    },
    onFinish: (message) => {
      console.log('✅ Chat finished, final message:', message);
      
      // Update both the chat messages and our local messages
      const updateMessages = (currentMessages: Message[]) => {
        // Keep all non-streaming messages
        const existingMessages = currentMessages.filter(m => !m.id.startsWith('streaming-'));
        
        // Check if we already have this message to avoid duplicates
        const messageExists = existingMessages.some(m => m.id === message.id);
        
        // If message doesn't exist, add it while preserving order
        return messageExists ? existingMessages : [...existingMessages, message];
      };

      setMessages(updateMessages);
      setLocalMessages(updateMessages);

      // Reset stream state
      streamContent.current = '';
      streamMessageId.current = 'streaming-' + Date.now();
      mutate('/api/history');
    },
  });

  // Maintain our own messages state to prevent resets
  const [messages, setLocalMessages] = useState(initialMessages);
  
  // Track accumulated content
  const streamContent = useRef('');
  const streamMessageId = useRef('streaming-' + Date.now());

  // Update local messages when chat messages change
  useEffect(() => {
    if (chatMessages.length > 0) {
      // Update all messages to maintain conversation history
      setLocalMessages(currentMessages => {
        // Create a map of existing messages by ID for quick lookup
        const existingMessagesMap = new Map(currentMessages.map(m => [m.id, m]));
        
        // Add or update messages from chatMessages
        chatMessages.forEach(message => {
          existingMessagesMap.set(message.id, message);
        });
        
        // Convert back to array and sort by creation time
        return Array.from(existingMessagesMap.values())
          .sort((a, b) => {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return timeA - timeB;
          });
      });
    }
  }, [chatMessages]);

  useEffect(() => {
    if (dataStream && dataStream.length > 0) {
      console.log('🌊 DataStream update:', {
        streamLength: dataStream.length,
        lastDelta: dataStream[dataStream.length - 1]
      });
      
      const lastDelta = dataStream[dataStream.length - 1] as { type: string; content: string };
      if (lastDelta.type === 'text-delta') {
        console.log('📝 Processing text delta:', lastDelta.content);
        
        // Accumulate content
        streamContent.current += lastDelta.content;
        
        // Update streaming message
        setLocalMessages(currentMessages => {
          // Remove any existing streaming messages
          const withoutStreaming = currentMessages.filter(m => !m.id.startsWith('streaming-'));
          
          // Add the current streaming message at the end
          return [...withoutStreaming, {
            id: streamMessageId.current,
            role: 'assistant',
            content: streamContent.current,
            createdAt: new Date()
          }];
        });
      }
    }
  }, [dataStream]);

  // Keep these logs for debugging
  useEffect(() => {
    console.log('📨 Messages state update:', {
      messageCount: messages.length,
      messages,
      isLoading,
      lastMessageRole: messages[messages.length - 1]?.role
    });
  }, [messages, isLoading]);

  const { data: votes } = useSWR<Array<Vote>>(
    `/api/vote?chatId=${id}`,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isBlockVisible = useBlockSelector((state) => state.isVisible);

  const handleModelChange = (modelId: string) => {
    setCurrentModelId(modelId);
    reload();
  };

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <ChatHeader
          chatId={id}
          selectedModelId={currentModelId}
          selectedVisibilityType={selectedVisibilityType}
          isReadonly={isReadonly}
          onModelChange={handleModelChange}
        />

        <Messages
          chatId={id}
          isLoading={isLoading}
          votes={votes}
          messages={messages}
          setMessages={setLocalMessages}
          reload={reload}
          isReadonly={isReadonly}
          isBlockVisible={isBlockVisible}
        />

        {!isReadonly && (
          <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
            <MultimodalInput
              chatId={id}
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages}
              setMessages={setLocalMessages}
              append={append}
            />
          </form>
        )}
      </div>

      <Block
        chatId={id}
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        append={append}
        messages={messages}
        setMessages={setLocalMessages}
        reload={reload}
        votes={votes}
        isReadonly={isReadonly}
      />

      <DataStreamHandler dataStream={dataStream} />
    </>
  );
}
