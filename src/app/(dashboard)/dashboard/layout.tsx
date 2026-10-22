"use client";

import { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { DashboardProvider } from "./dashboard-context";
import { useAuth } from "@/hooks/use-auth";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const userRole = user?.role || "VIEWER";
  const userName = user?.fullName || "User";
  const userEmail = user?.email || "";

  if (isLoading) {
    return (
      <DashboardProvider>
        <div className="min-h-screen bg-muted animate-pulse">
          <div className="h-16 bg-muted" />
          <div className="lg:pl-64">
            <div className="h-16 bg-muted" />
            <main className="p-4 sm:p-6 lg:p-8">
              <div className="h-8 bg-muted rounded w-1/4" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mt-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-12 bg-muted rounded-lg" />
                ))}
              </div>
            </main>
          </div>
        </div>
      </DashboardProvider>
    );
  }

  return (
    <DashboardProvider>
      <div className="min-h-screen bg-muted">
        <Sidebar
          userRole={userRole}
          userName={userName}
          userEmail={userEmail}
        />
        <div className="lg:pl-64">
          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </DashboardProvider>
  );
}
