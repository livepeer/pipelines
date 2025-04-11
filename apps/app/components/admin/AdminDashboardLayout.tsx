import { AdminCard } from "./AdminCard";

interface AdminDashboardLayoutProps {
  email: string | null | undefined;
}

export function AdminDashboardLayout({ email }: AdminDashboardLayoutProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <p className="mb-4 text-sm text-gray-500">Logged in as: {email}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        <AdminCard
          title="Pipelines"
          description="Manage pipeline configurations and settings"
          link="/admin/pipelines"
        />
        <AdminCard
          title="Clips"
          description="Manage clips uploaded to Daydream by users"
          link="/admin/clips"
        />
        <AdminCard
          title="Users"
          description="Manage users of Daydream, ban them, remove them, etc."
          link="/admin/users"
        />
      </div>
    </div>
  );
} 