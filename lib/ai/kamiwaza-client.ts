// lib/ai/kamiwaza-client.ts

export interface KamiwazaModel {
    id: string;
    name: string;
    hub: string | null;
    version: string | null;
    private: boolean | null;
    description: string | null;
  }
  
  export interface ModelInstance {
    id: string;
    deployment_id: string;
    host_name: string | null;
    listen_port: number;
    status: string;
  }
  
  export interface UIModelDeployment {
    id: string;
    m_id: string;
    engine: string;
    container: string;
    status: string;
    lb_port: number;
    instances: ModelInstance[];
  }
  
  export class KamiwazaClient {
    constructor(private baseUrl: string) {}
  
    async listModels(): Promise<KamiwazaModel[]> {
      const response = await fetch(`${this.baseUrl}/models/`);
      if (!response.ok) throw new Error('Failed to fetch models');
      return response.json();
    }
  
    async listDeployments(modelId?: string): Promise<UIModelDeployment[]> {
      const url = modelId 
        ? `${this.baseUrl}/serving/deployments?model_id=${modelId}`
        : `${this.baseUrl}/serving/deployments`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch deployments');
      const deployments: UIModelDeployment[] = await response.json();

      // Filter to only return deployments that are "DEPLOYED"
      return deployments.filter((d) => d.status === 'DEPLOYED');
    }
  
    async getDeploymentById(deploymentId: string): Promise<UIModelDeployment> {
      const response = await fetch(`${this.baseUrl}/serving/deployment/${deploymentId}`);
      if (!response.ok) throw new Error('Failed to fetch deployment');
      return response.json();
    }
  }