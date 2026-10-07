'use client'

import { ReactNode } from 'react'
import { Sidebar, Topbar } from './sidebar'
import { DashboardProvider } from './dashboard-context'
import { useAuth } from '@/hooks/use-auth'
import { QueryProvider } from '@/lib/query-provider'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  const userRole = user?.role || 'VIEWER'
  const userName = user?.fullName || 'User'
  const userEmail = user?.email || ''

  if (isLoading) {
    return (
      <QueryProvider>
        <DashboardProvider>
          <div className="min-h-screen bg-gray-50 animate-pulse">
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
      </QueryProvider>
    )
  }

  return (
    <QueryProvider>
      <DashboardProvider>
        <div className="min-h-screen bg-gray-50">
          <Sidebar userRole={userRole} userName={userName} userEmail={userEmail} />
          <div className="lg:pl-64">
            <Topbar userRole={userRole} userName={userName} userEmail={userEmail} />
            <main className="p-4 sm:p-6 lg:p-8">{children}</main>
          </div>
        </div>
      </DashboardProvider>
    </QueryProvider>
  )
}
