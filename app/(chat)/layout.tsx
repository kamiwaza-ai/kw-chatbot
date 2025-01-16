
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
      <div className="flex h-screen overflow-hidden"> {/* Changed min-h-screen to h-screen and added overflow-hidden */}
        <AppSidebar user={user} />
        <main className="flex-1 flex flex-col w-full overflow-hidden">{children}</main> {/* Added flex flex-col and w-full */}
      </div>
    </SidebarProvider>
  );
}