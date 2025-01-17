// app/(auth)/login/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';
import Link from 'next/link';

interface LoginState {
  status: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [state, setState] = useState<LoginState>({ status: 'idle' });
  const [username, setUsername] = useState('');

  async function handleSubmit(formData: FormData) {
    console.log('🔵 Login: Starting login attempt...', {
      formData: Object.fromEntries(formData.entries())
    });
    setState({ status: 'loading' });
    setUsername(formData.get('username') as string);

    try {
      const url = '/api/auth/login';
      console.log('🔵 Login: Sending request to', url);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.get('username'),
          password: formData.get('password'),
        }),
      });

      console.log('🔵 Login: Response received', { 
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('🔴 Login: Request failed', { 
          status: response.status,
          statusText: response.statusText,
          errorData 
        });
        throw new Error('Login failed');
      }

      const data = await response.json();
      console.log('🔵 Login: Success', { data });

      setState({ status: 'success' });
      console.log('🔵 Login: Redirecting to home page...');
      router.push('/'); // Redirect to home page
      router.refresh(); // Refresh the page to update the auth state
    } catch (error) {
      console.error('🔴 Login: Error during login:', error);
      setState({ 
        status: 'error', 
        message: 'Invalid credentials'
      });
      toast.error('Login failed. Please check your credentials.');
    }
  }

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">Sign In</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Use your Kamiwaza credentials to sign in
          </p>
        </div>
        <AuthForm action={handleSubmit} defaultUsername={username}>
          <SubmitButton isSuccessful={state.status === 'success'}>Sign in</SubmitButton>
         
        </AuthForm>
      </div>
    </div>
  );
}