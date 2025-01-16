import { useEffect, useState } from 'react';
import { KamiwazaClient } from '@/lib/ai/kamiwaza-client';
import type { Model } from '@/lib/ai/models';
import { mapKamiwazaToModel, models as globalModels } from '@/lib/ai/models';

export function useModels() {
  const [models, setModels] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const client = new KamiwazaClient(process.env.NEXT_PUBLIC_KAMIWAZA_URI!);
    
    async function loadModels() {
      try {
        const [modelList, deployments] = await Promise.all([
          client.listModels(),
          client.listDeployments()
        ]);

        const mappedModels = modelList
          .map(model => {
            const deployment = deployments.find(d => d.m_id === model.id);
            return deployment ? mapKamiwazaToModel(model, deployment) : null;
          })
          .filter((model): model is Model => model !== null);

        setModels(mappedModels);
        globalModels.length = 0;
        globalModels.push(...mappedModels);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }

    loadModels();
  }, []);

  return { models, isLoading, error };
}