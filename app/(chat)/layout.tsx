// app/(chat)/layout.tsx
import { cookies } from 'next/headers';
import { AppSidebar } from '@/components/app-sidebar';
import { getAuthCookie } from '@/lib/auth/cookies';
import { getCurrentUser } from '@/lib/auth/kamiwaza';
import { SidebarProvider } from '@/components/ui/sidebar';

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [token, cookieStore] = await Promise.all([
    getAuthCookie(),
    cookies()
  ]);

  const user = token ? await getCurrentUser(token) : null;
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';

  return (
    <SidebarProvider defaultOpen={!isCollapsed}>
      <div className="flex min-h-screen h-screen">
        <AppSidebar user={user} />
        <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
      </div>
    </SidebarProvider>
  );
}