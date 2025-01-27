// lib/ai/index.ts

// import { openai } from '@ai-sdk/openai';
// import { experimental_wrapLanguageModel as wrapLanguageModel } from 'ai';

// import { customMiddleware } from './custom-middleware';

// export const customModel = (apiIdentifier: string) => {
//   return wrapLanguageModel({
//     model: openai(apiIdentifier),
//     middleware: customMiddleware,
//   });
// };

// export const imageGenerationModel = openai.image('dall-e-3');

//lib/ai/index.ts
import { experimental_wrapLanguageModel as wrapLanguageModel } from 'ai';
import { models, createKamiwazaProvider, createOpenAICompatible, initializeModels } from './models';
import { customMiddleware } from './custom-middleware';

export const customModel = async (apiIdentifier: string) => {
  // Initialize models if they haven't been initialized yet
  if (models.length === 0) {
    await initializeModels();
  }

  const model = models.find(m => m.apiIdentifier === apiIdentifier);
  if (!model) throw new Error(`Model ${apiIdentifier} not found`);

  let provider;
  if (model.type === 'kamiwaza') {
    if (!model.deployment) throw new Error(`Kamiwaza model ${apiIdentifier} not deployed`);
    provider = createKamiwazaProvider(model.deployment.lb_port);
  } else if (model.type === 'custom') {
    if (!model.uri) throw new Error(`Custom model ${apiIdentifier} has no URI`);
    provider = createOpenAICompatible({
      name: 'model',
      baseURL: model.uri,
      headers: {
        'Content-Type': 'application/json',
        ...(model.apiKey && { 'Authorization': `Bearer ${model.apiKey}` })
      }
    });
  } else {
    throw new Error(`Unknown model type: ${model.type}`);
  }
  
  return wrapLanguageModel({
    model: provider('model'),  // Always use 'model' here
    middleware: customMiddleware
  });
};

// Remove or modify image generation as needed
export const imageGenerationModel = null;