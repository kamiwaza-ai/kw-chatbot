// components/chat.tsx

'use client';

import type { Attachment, Message } from 'ai';
import { useChat } from 'ai/react';
import { useState, useCallback } from 'react';
import useSWR, { useSWRConfig } from 'swr';

import { ChatHeader } from '@/components/chat-header';
import type { Vote } from '@/lib/db/schema';
import { fetcher } from '@/lib/utils';

import { Block } from './block';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import { VisibilityType } from './visibility-selector';
import { useBlockSelector } from '@/hooks/use-block';

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

  console.log('Chat component state:', { currentModelId, selectedModelId });

  const {
    messages,
    setMessages,
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
    experimental_throttle: 100,
    onFinish: () => {
      console.log('Chat finished, model used:', currentModelId);
      mutate('/api/history');
    },
    onError: (error) => {
      console.error('Chat error:', { error, modelId: currentModelId });
    }
  });

  const { data: votes } = useSWR<Array<Vote>>(
    `/api/vote?chatId=${id}`,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isBlockVisible = useBlockSelector((state) => state.isVisible);

  const handleModelChange = useCallback((modelId: string) => {
    console.log('Model change requested:', { from: currentModelId, to: modelId });
    setCurrentModelId(modelId);
    reload();
  }, [currentModelId, reload]);

  const wrappedHandleSubmit = useCallback((event?: { preventDefault?: () => void }, chatRequestOptions?: any) => {
    console.log('Submitting chat with model:', { modelId: currentModelId, options: chatRequestOptions });
    return handleSubmit(event, chatRequestOptions);
  }, [handleSubmit, currentModelId]);

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
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
          isBlockVisible={isBlockVisible}
        />

        <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
          {!isReadonly && (
            <MultimodalInput
              chatId={id}
              input={input}
              setInput={setInput}
              handleSubmit={wrappedHandleSubmit}
              isLoading={isLoading}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages}
              setMessages={setMessages}
              append={append}
            />
          )}
        </form>
      </div>

      <Block
        chatId={id}
        input={input}
        setInput={setInput}
        handleSubmit={wrappedHandleSubmit}
        isLoading={isLoading}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        append={append}
        messages={messages}
        setMessages={setMessages}
        reload={reload}
        isReadonly={isReadonly}
      />
    </>
  );
}