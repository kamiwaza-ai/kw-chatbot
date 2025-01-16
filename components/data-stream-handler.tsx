'use client';

import { useChat } from 'ai/react';
import { useEffect, useRef, useState } from 'react';
import { BlockKind } from './block';
import { Suggestion } from '@/lib/db/schema';
import { initialBlockData, useBlock } from '@/hooks/use-block';
import { useUserMessageId } from '@/hooks/use-user-message-id';
import { useSWRConfig } from 'swr';

type DataStreamDelta = {
  type:
    | 'text'
    | 'text-delta'
    | 'code-delta'
    | 'image-delta'
    | 'title'
    | 'id'
    | 'suggestion'
    | 'clear'
    | 'finish'
    | 'user-message-id'
    | 'kind';
  content: string | Suggestion;
};

export function DataStreamHandler({ id }: { id: string }) {
  const { messages, setMessages } = useChat({ id });
  const { setUserMessageIdFromServer } = useUserMessageId();
  const { setBlock } = useBlock();
  const streamingContent = useRef('');

  const { mutate } = useSWRConfig();
  const [optimisticSuggestions, setOptimisticSuggestions] = useState<
    Array<Suggestion>
  >([]);

  useEffect(() => {
    if (optimisticSuggestions && optimisticSuggestions.length > 0) {
      const [optimisticSuggestion] = optimisticSuggestions;
      const url = `/api/suggestions?documentId=${optimisticSuggestion.documentId}`;
      mutate(url, optimisticSuggestions, false);
    }
  }, [optimisticSuggestions, mutate]);

  useEffect(() => {
    const eventSource = new EventSource(`/api/chat?id=${id}`);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'user-message-id') {
        setUserMessageIdFromServer(data.content);
        return;
      }

      if (data.type === 'text') {
        streamingContent.current += data.content;
        
        setMessages(messages => {
          const lastMessage = messages[messages.length - 1];
          if (lastMessage?.role === 'assistant') {
            return messages.map((msg, i) => 
              i === messages.length - 1 
                ? { ...msg, content: streamingContent.current }
                : msg
            );
          } else {
            return [...messages, {
              id: Date.now().toString(),
              role: 'assistant',
              content: streamingContent.current,
              createdAt: new Date()
            }];
          }
        });

        setBlock(draftBlock => ({
          ...draftBlock || initialBlockData,
          content: streamingContent.current,
          status: 'streaming'
        }));
      }

      if (data.type === 'finish') {
        streamingContent.current = '';
        setBlock(draftBlock => ({
          ...draftBlock || initialBlockData,
          status: 'idle'
        }));
        eventSource.close();
      }
    };

    return () => {
      eventSource.close();
    };
  }, [id, setMessages, setUserMessageIdFromServer, setBlock]);

  return null;
}
