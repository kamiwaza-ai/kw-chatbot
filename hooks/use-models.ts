import type { Model } from '@/lib/ai/models';
import { models as globalModels } from '@/lib/ai/models';
import useSWR from 'swr';

export function useModels() {
  const { data: models = [], isLoading, error, mutate } = useSWR<Model[]>(
    'models',
    async () => {
      const response = await fetch('/api/models');
      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }
      const allModels = await response.json();
      
      // Update global models
      globalModels.length = 0;
      globalModels.push(...allModels);
      
      return allModels;
    }
  );

  return { models, isLoading, error, mutate };
}