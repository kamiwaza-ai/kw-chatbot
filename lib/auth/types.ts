// lib/auth/types.ts
export interface KamiwazaTokenResponse {
    access_token: string;
    token_type: 'bearer';
    expires_in: number;
    refresh_token: null;
    id_token: null;
  }
  
  export interface KamiwazaUser {
    username: string;
    email: string;
    full_name: string | null;
    organization_id: string | null;
    is_superuser: boolean;
    external_id: string | null;
    id: string;
    is_active: boolean;
    groups: string[];
    created_at: string;
    updated_at: string | null;
    last_login: string | null;
  }