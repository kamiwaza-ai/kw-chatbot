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
    },
    onFinish: (message) => {
      console.log('✅ Chat finished, final message:', message);
      // Ensure we keep the final message
      setMessages(currentMessages => {
        const withoutStreaming = currentMessages.filter(m => !m.id.startsWith('streaming-'));
        return [...withoutStreaming, message];
      });
      mutate('/api/history');
    },
  });

  // Maintain our own messages state to prevent resets
  const [messages, setLocalMessages] = useState(initialMessages);
  
  // Keep these logs for debugging
  useEffect(() => {
    console.log('📨 Messages state update:', {
      messageCount: messages.length,
      messages,
      isLoading,
      lastMessageRole: messages[messages.length - 1]?.role
    });
  }, [messages, isLoading]);

  // Track accumulated content
  const streamContent = useRef('');
  const streamMessageId = useRef('streaming-' + Date.now());

  // Update local messages when chat messages change
  useEffect(() => {
    if (chatMessages.length > 0) {
      const lastMessage = chatMessages[chatMessages.length - 1];
      if (lastMessage.role === 'user') {
        setLocalMessages(chatMessages);
      }
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
        
        // Update or create streaming message
        setLocalMessages(currentMessages => {
          const withoutStreaming = currentMessages.filter(m => !m.id.startsWith('streaming-'));
          return [...withoutStreaming, {
            id: streamMessageId.current,
            role: 'assistant',
            content: streamContent.current,
            createdAt: new Date()
          }];
        });
      } else if (lastDelta.type === 'finish') {
        // Reset for next stream
        streamContent.current = '';
        streamMessageId.current = 'streaming-' + Date.now();
      }
    }
  }, [dataStream]);

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
