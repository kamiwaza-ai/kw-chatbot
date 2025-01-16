// lib/ai/models.ts

// export interface Model {
//   id: string;
//   label: string;
//   apiIdentifier: string;
//   description: string;
// }

// export const models: Array<Model> = [
//   {
//     id: 'gpt-4o-mini',
//     label: 'GPT 4o mini',
//     apiIdentifier: 'gpt-4o-mini',
//     description: 'Small model for fast, lightweight tasks',
//   },
//   {
//     id: 'gpt-4o',
//     label: 'GPT 4o',
//     apiIdentifier: 'gpt-4o',
//     description: 'For complex, multi-step tasks',
//   },
// ] as const;

// export const DEFAULT_MODEL_NAME: string = 'gpt-4o-mini';

import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { KamiwazaClient, UIModelDeployment, KamiwazaModel } from '@/lib/ai/kamiwaza-client';

export interface Model {
  id: string;
  label: string;
  apiIdentifier: string;
  description: string;
  deployment?: {
    id: string;
    lb_port: number;
  };
}

// Will be populated from Kamiwaza API
export let models: Model[] = [];

// Helper to get a valid model ID
export function getValidModelId(modelId?: string | null): string {
  // If a model ID is provided and exists in the models list, use it
  if (modelId && models.some(model => model.id === modelId)) {
    return modelId;
  }
  
  // Otherwise use the first available model
  const firstModel = models[0];
  if (!firstModel) {
    throw new Error('No models available');
  }
  
  return firstModel.id;
}

// Kamiwaza OpenAI-compatible provider factory
export function createKamiwazaProvider(port: number) {
  // Convert HTTPS to HTTP and remove /api from the base URL
  const baseUrl = process.env.NEXT_PUBLIC_KAMIWAZA_URI!
    .replace('https://', 'http://')
    .replace('/api', '');
  
  return createOpenAICompatible({
    name: 'model',
    baseURL: `${baseUrl}:${port}/v1`,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

// Function to convert Kamiwaza models to our format
export function mapKamiwazaToModel(
  model: KamiwazaModel, 
  deployment?: UIModelDeployment
): Model {
  return {
    id: model.id,
    label: model.name,
    apiIdentifier: `${model.name}${model.version ? `@${model.version}` : ''}`,
    description: model.description || '',
    deployment: deployment ? {
      id: deployment.id,
      lb_port: deployment.lb_port
    } : undefined
  };
}

// Initialize models from Kamiwaza
export async function initializeModels() {
  const client = new KamiwazaClient(process.env.KAMIWAZA_URI!);
  const [modelList, deployments] = await Promise.all([
    client.listModels(),
    client.listDeployments()
  ]);

  models = modelList.map(model => {
    const deployment = deployments.find(d => d.m_id === model.id);
    return mapKamiwazaToModel(model, deployment);
  });
}