"use client";

import { ReactNode, useEffect } from "react";
import { AdminProvider, useAdmin } from "@/hooks/useAdmin";
import Link from "next/link";
import { usePathname, redirect } from "next/navigation";
import { usePrivy } from "@/hooks/usePrivy";
import { ExternalLinkIcon, LogOutIcon } from "lucide-react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminProvider>
  );
}

function AdminLayoutContent({ children }: { children: ReactNode }) {
  const { isAdmin, isLoading: adminLoading, email } = useAdmin();

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      console.log("AdminLayout: Access denied, redirecting...");
      redirect("/");
    }
  }, [adminLoading, isAdmin]);

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminHeader />
      <div className="flex">
        <AdminSidebar email={email} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

function AdminHeader() {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link href="/admin" className="text-xl font-bold text-gray-900">
              Daydream Admin
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

function AdminSidebar({ email }: { email: string | null | undefined }) {
  const pathname = usePathname();
  const { logout } = usePrivy();

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`);
  };

  const navItems = [
    { name: "Dashboard", path: "/admin" },
    { name: "Pipelines", path: "/admin/pipelines" },
    { name: "Clips", path: "/admin/clips" },
    { name: "Users", path: "/admin/users" },
    { name: "Tools", path: "/admin/tools" },
  ];

  return (
    <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)] flex flex-col">
      <nav className="mt-5 px-2">
        <ul className="space-y-1">
          {navItems.map(item => (
            <li key={item.path}>
              <Link
                href={item.path}
                className={`group flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  isActive(item.path)
                    ? "bg-indigo-100 text-indigo-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-auto p-4 border-t border-gray-200">
        {email && (
          <p className="text-xs text-gray-500 mb-2 truncate">
            Logged in as: {email}
          </p>
        )}
        <ul className="space-y-1">
          <li>
            <Link
              href="/"
              className="group flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <ExternalLinkIcon className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500" />
              Daydream Home
            </Link>
          </li>
          <li>
            <button
              onClick={() => logout()}
              className="group w-full flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <LogOutIcon className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500" />
              Log out
            </button>
          </li>
        </ul>
      </div>
    </aside>
  );
}
