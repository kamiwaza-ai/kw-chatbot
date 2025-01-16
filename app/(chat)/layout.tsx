// app/(chat)/layout.tsx
import { cookies } from 'next/headers';
import { AppSidebar } from '@/components/app-sidebar';
import { getAuthCookie } from '@/lib/auth/cookies';
import { getCurrentUser } from '@/lib/auth/kamiwaza';
import { SidebarProvider } from '@/components/ui/sidebar';
import { SidebarInset } from '@/components/ui/sidebar';
import Script from 'next/script';



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
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <SidebarProvider defaultOpen={!isCollapsed}>
        <AppSidebar user={user} />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </>
  );
}