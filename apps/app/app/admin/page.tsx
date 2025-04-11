"use client";

import { useEffect } from "react";
import { redirect } from "next/navigation";
import { useAdmin } from "@/hooks/useAdmin";
import { AdminDashboardLayout } from "@/components/admin/AdminDashboardLayout";

export default function AdminDashboard() {
  const { isAdmin, isLoading, email } = useAdmin();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      console.log("Access denied: Not an admin (livepeer.org email required)");
      redirect("/");
    }
  }, [isAdmin, isLoading]);

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <AdminDashboardLayout email={email} />
  );
} 