// components/data-stream-handler.tsx
'use client';

import { useEffect, useRef } from 'react';
import { initialBlockData, useBlock } from '@/hooks/use-block';
import { useUserMessageId } from '@/hooks/use-user-message-id';

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
  content: string;
};

export function DataStreamHandler({ 
  dataStream 
}: { 
  dataStream: any;
}) {
  const { setUserMessageIdFromServer } = useUserMessageId();
  const { setBlock } = useBlock();
  const lastProcessedIndex = useRef(-1);

  useEffect(() => {
    if (!dataStream?.length) return;
    console.log('🎯 DataStreamHandler received dataStream:', dataStream);

    const newDeltas = dataStream.slice(lastProcessedIndex.current + 1);
    console.log('🔄 Processing new deltas:', newDeltas, 'from index:', lastProcessedIndex.current);
    lastProcessedIndex.current = dataStream.length - 1;

    newDeltas.forEach((delta: DataStreamDelta) => {
      console.log('📦 Processing delta:', delta);
      
      if (delta.type === 'user-message-id') {
        console.log('👤 Setting user message ID:', delta.content);
        setUserMessageIdFromServer(delta.content);
        return;
      }

      // Only handle block-related state updates
      if (delta.type === 'text-delta' || delta.type === 'finish') {
        setBlock((draftBlock) => {
          if (!draftBlock) {
            console.log('🆕 Creating new block with status:', delta.type === 'finish' ? 'idle' : 'streaming');
            return { 
              ...initialBlockData, 
              status: delta.type === 'finish' ? 'idle' : 'streaming',
              content: delta.type === 'text-delta' ? delta.content : ''
            };
          }

          console.log('📝 Updating block with delta:', delta);
          return {
            ...draftBlock,
            content: delta.type === 'text-delta' ? draftBlock.content + delta.content : draftBlock.content,
            status: delta.type === 'finish' ? 'idle' : 'streaming',
          };
        });
      }
    });
  }, [dataStream, setBlock, setUserMessageIdFromServer]);

  return null;
}
