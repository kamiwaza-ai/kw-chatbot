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
import { models, createKamiwazaProvider, initializeModels } from './models';
import { customMiddleware } from './custom-middleware';

export const customModel = async (apiIdentifier: string) => {
  // Initialize models if they haven't been initialized yet
  if (models.length === 0) {
    await initializeModels();
  }

  const model = models.find(m => m.apiIdentifier === apiIdentifier);
  if (!model) throw new Error(`Model ${apiIdentifier} not found`);
  if (!model.deployment) throw new Error(`Model ${apiIdentifier} not deployed`);

  const provider = createKamiwazaProvider(model.deployment.lb_port);
  
  return wrapLanguageModel({
    model: provider('model'),  // Always use 'model' here
    middleware: customMiddleware
  });
};

// Remove or modify image generation as needed
export const imageGenerationModel = null;