import { ReactNode } from 'react'
import { Sidebar, Topbar } from './sidebar'
import { DashboardProvider } from './dashboard-context'
import { getCurrentUser } from '@/lib/auth'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser()
  const userRole = user?.role || 'VIEWER'
  const userName = user?.fullName || 'User'
  const userEmail = user?.email || ''

  return (
    <DashboardProvider>
      <div className="min-h-screen bg-gray-50">
        <Sidebar userRole={userRole} userName={userName} userEmail={userEmail} />
        <div className="lg:pl-64">
          <Topbar userRole={userRole} userName={userName} userEmail={userEmail} />
          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </DashboardProvider>
  )
}
