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
//lib/ai/models.ts

import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
export { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { KamiwazaClient, UIModelDeployment, KamiwazaModel } from '@/lib/ai/kamiwaza-client';
import type { CustomModelEndpoint } from '@/lib/db/schema';

export interface Model {
  id: string;
  label: string;
  apiIdentifier: string;
  description: string;
  type: 'kamiwaza' | 'custom';
  deployment?: {
    id: string;
    lb_port: number;
  };
  // For custom endpoints
  uri?: string;
  apiKey?: string;
}

export interface ModelEndpoint {
  id: string;
  name: string;
  uri: string;
  apiKey: string | null;
  providerType: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  isActive: boolean;
}

// Will be populated from Kamiwaza API and custom endpoints
export let models: Model[] = [];

// Helper to get a valid model ID
export function getValidModelId(modelId?: string | null): string {
  console.log('Getting valid model ID for:', modelId);
  console.log('Available models:', models);
  
  // If a model ID is provided and exists in the models list, use it
  if (modelId && models.some(model => model.id === modelId)) {
    console.log('Found matching model ID:', modelId);
    return modelId;
  }
  
  // Otherwise use the first available model
  const firstModel = models[0];
  if (!firstModel) {
    console.error('No models available in models array');
    throw new Error('No models available');
  }
  
  console.log('Using first available model:', firstModel.id);
  return firstModel.id;
}

// Create provider based on model type
export function createProvider(model: Model) {
  console.log('Creating provider for model:', model);
  
  if (model.type === 'kamiwaza' && model.deployment) {
    console.log('Creating Kamiwaza provider with port:', model.deployment.lb_port);
    return createKamiwazaProvider(model.deployment.lb_port);
  } else if (model.type === 'custom' && model.uri) {
    console.log('Creating custom provider with URI:', { uri: model.uri, headers: model.apiKey ? { Authorization: 'Bearer [REDACTED]' } : {} });
    return createOpenAICompatible({
      name: 'model',
      baseURL: model.uri,
      headers: {
        'Content-Type': 'application/json',
        ...(model.apiKey && { 'Authorization': `Bearer ${model.apiKey}` })
      }
    });
  }
  throw new Error(`Invalid model configuration for ${model.id}`);
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
    type: 'kamiwaza',
    deployment: deployment ? {
      id: deployment.id,
      lb_port: deployment.lb_port
    } : undefined
  };
}

// Function to convert custom endpoints to our format
function mapCustomEndpointToModel(endpoint: CustomModelEndpoint): Model {
  return {
    id: endpoint.id,
    label: endpoint.name,
    apiIdentifier: endpoint.name,
    description: `Custom endpoint: ${endpoint.uri}`,
    type: 'custom' as const,
    uri: endpoint.uri,
    apiKey: endpoint.apiKey || undefined
  };
}

async function getKamiwazaModels(): Promise<Model[]> {
  const client = new KamiwazaClient(process.env.KAMIWAZA_URI!);
  const [modelList, deployments] = await Promise.all([
    client.listModels(),
    client.listDeployments()
  ]);

  return modelList.map(model => {
    const deployment = deployments.find(d => d.m_id === model.id);
    return mapKamiwazaToModel(model, deployment);
  });
}

export async function initializeModels(userId?: string, token?: string): Promise<Model[]> {
  console.log('Initializing models for user:', userId);
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  console.log('Using base URL:', baseUrl);
  
  let customEndpoints: ModelEndpoint[] = [];
  if (userId && token) {
    try {
      const response = await fetch(`${baseUrl}/api/model-endpoints`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('Custom endpoints response status:', response.status);
      if (!response.ok) {
        const text = await response.text();
        console.error('Failed to fetch custom endpoints:', text);
      } else {
        customEndpoints = await response.json();
        console.log('Fetched custom endpoints:', customEndpoints);
      }
    } catch (error) {
      console.error('Error fetching custom endpoints:', error);
    }
  }

  const kamiwazaModels = await getKamiwazaModels();
  console.log('Fetched Kamiwaza models:', kamiwazaModels);

  const customModels: Model[] = customEndpoints.map((endpoint: ModelEndpoint) => ({
    id: endpoint.id,
    label: endpoint.name,
    apiIdentifier: endpoint.name,
    description: `Custom endpoint: ${endpoint.uri}`,
    type: 'custom' as const,
    uri: endpoint.uri,
    apiKey: endpoint.apiKey || undefined
  }));
  console.log('Mapped custom models:', customModels);

  const newModels = [...kamiwazaModels, ...customModels];
  console.log('Final models array:', newModels);
  
  // Update the global models array
  updateModels(newModels);
  
  return models; // Return the global models array after updating it
}

// Update models array with new models
export function updateModels(newModels: Model[]) {
  models.length = 0;
  models.push(...newModels);
}