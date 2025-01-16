import Form from 'next/form';
import { signOut } from '@/lib/auth/auth';

export const SignOutForm = () => {
  return (
    <Form
      action={async () => {
        await signOut();
      }}
    >
      <button type="submit">Sign out</button>
    </Form>
  );
};
