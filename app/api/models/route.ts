import { getSession } from '@/lib/auth/session';
import { KamiwazaClient } from '@/lib/ai/kamiwaza-client';
import { mapKamiwazaToModel } from '@/lib/ai/models';
import { db } from '@/lib/db';
import { and, eq } from 'drizzle-orm';
import { customModelEndpoint } from '@/lib/db/schema';

function mapCustomEndpointToModel(endpoint: any) {
  return {
    id: endpoint.id,
    label: endpoint.name,
    apiIdentifier: endpoint.name,
    description: `Custom endpoint: ${endpoint.uri}`,
    type: 'custom',
    uri: endpoint.uri,
    apiKey: endpoint.apiKey || undefined
  };
}

async function listCustomModelEndpoints(userId: string) {
  return db
    .select()
    .from(customModelEndpoint)
    .where(and(
      eq(customModelEndpoint.userId, userId),
      eq(customModelEndpoint.isActive, true)
    ));
}

export async function GET() {
  const session = await getSession();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Load Kamiwaza models
    const client = new KamiwazaClient(process.env.NEXT_PUBLIC_KAMIWAZA_URI!);
    const [modelList, deployments] = await Promise.all([
      client.listModels(),
      client.listDeployments()
    ]);

    const kamiwazaModels = modelList.map(model => {
      const deployment = deployments.find(d => d.m_id === model.id);
      return mapKamiwazaToModel(model, deployment);
    });

    // Load custom endpoints
    const endpoints = await listCustomModelEndpoints(session.user.dbId);
    const customModels = endpoints.map(mapCustomEndpointToModel);

    // Combine both types
    const allModels = [...kamiwazaModels, ...customModels];
    
    return Response.json(allModels);
  } catch (error) {
    console.error('Failed to fetch models:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 