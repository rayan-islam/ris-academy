import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AdminNavbar } from '@/components/layout/admin-navbar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const role = (session.user as any)?.role;
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && role !== 'MODERATOR') redirect('/dashboard');

  return (
    <div className="min-h-screen bg-muted/30">
      <AdminNavbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6 lg:p-8 pt-20 ml-0 lg:ml-64">
          {children}
        </main>
      </div>
    </div>
  );
}
