// components/data-stream-handler.tsx

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
  /**
   * ----------------------------------------------------------------
   * 1. Hook into the same chat session via useChat({ id }).
   *    This gives us a `messages` array and `setMessages` so we can
   *    inject an ephemeral assistant message while it’s streaming.
   * ----------------------------------------------------------------
   */
  const { data: dataStream } = useChat({ id }); // <== The streaming deltas
  const { messages, setMessages } = useChat({ id }); 
  // You already have a second call to useChat above. That’s okay here,
  // though typically you could condense them if you want.

  /**
   * The rest of your existing code stays mostly unchanged.
   */
  const { setUserMessageIdFromServer } = useUserMessageId();
  const { setBlock } = useBlock();
  const lastProcessedIndex = useRef(-1);

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
    /**
     * ----------------------------------------------------------------
     * 2. If there’s no streamed data, do nothing.
     * ----------------------------------------------------------------
     */
    if (!dataStream?.length) return;

    /**
     * ----------------------------------------------------------------
     * 3. Identify the new chunks that arrived since our last pass.
     * ----------------------------------------------------------------
     */
    const newDeltas = dataStream.slice(lastProcessedIndex.current + 1);
    lastProcessedIndex.current = dataStream.length - 1;

    /**
     * ----------------------------------------------------------------
     * 4. Process each chunk.
     *    - Keep your existing block logic
     *    - ALSO update `messages` so the UI sees partial text
     * ----------------------------------------------------------------
     */
    (newDeltas as Array<DataStreamDelta>).forEach((delta) => {
      if (delta.type === 'user-message-id') {
        // The server is sending us the user message ID
        setUserMessageIdFromServer(delta.content as string);
        return;
      }

      // 4A. Update the "Block" store as you’re already doing
      setBlock((draftBlock) => {
        if (!draftBlock) {
          return { ...initialBlockData, status: 'streaming' };
        }

        switch (delta.type) {
          case 'text-delta':
            return {
              ...draftBlock,
              content: draftBlock.content + (delta.content as string),
              status: 'streaming',
            };

          case 'finish':
            return {
              ...draftBlock,
              status: 'idle',
            };

          default:
            return draftBlock;
        }
      });

      // 4B. ALSO inject partial text into the `messages` array so
      //     <Messages> sees it in real time.
      if (delta.type === 'text-delta') {
        setMessages((prev) => {
          // Check if the last message is an in-flight assistant message
          const last = prev[prev.length - 1];
          if (last && last.role === 'assistant' && last.id === 'streaming') {
            // Append partial content
            return [
              ...prev.slice(0, -1),
              {
                ...last,
                content: (last.content ?? '') + (delta.content as string),
              },
            ];
          } else {
            // Create a brand-new "assistant" message with an ephemeral ID
            return [
              ...prev,
              {
                id: 'streaming',
                role: 'assistant',
                content: delta.content as string,
              },
            ];
          }
        });
      }

      // When the server signals “finish”, finalize the ephemeral message
      if (delta.type === 'finish') {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (!last || last.id !== 'streaming') {
            return prev;
          }
          // Here, you might rename the ID from `streaming` to something else
          // so that it doesn’t clash with the final DB-saved message, or
          // you can just leave it as is. Typically you'd want to mark it final.
          return [
            ...prev.slice(0, -1),
            {
              ...last,
              // rename the ID or let it stand
              id: 'streaming-final',
            },
          ];
        });
      }
    });
  }, [dataStream, setBlock, setUserMessageIdFromServer, setMessages]);

  return null;
}
