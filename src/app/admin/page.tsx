import { getAdminSession } from '@/lib/auth';
import { getDatabaseEngine } from '@/lib/db/repository';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = getAdminSession();
  const dbEngine = getDatabaseEngine();

  return <AdminDashboard initialAuthenticated={Boolean(session)} adminEmail={session?.email || ''} dbEngine={dbEngine} />;
}
