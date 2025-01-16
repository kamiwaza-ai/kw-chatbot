// app/(auth)/actions.ts

'use server';

import { z } from 'zod';
import { getKamiwazaToken } from '@/lib/auth/kamiwaza';
import { setAuthCookie } from '@/lib/auth/cookies';

const authFormSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export interface LoginActionState {
  status: 'idle' | 'in_progress' | 'success' | 'failed' | 'invalid_data';
}

export const login = async (
  _: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      username: formData.get('username'),
      password: formData.get('password'),
    });

    // Get token from Kamiwaza
    const { access_token } = await getKamiwazaToken(
      validatedData.username,
      validatedData.password
    );

    // Set the auth cookie
    setAuthCookie(access_token);

    return { status: 'success' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }

    return { status: 'failed' };
  }
};

