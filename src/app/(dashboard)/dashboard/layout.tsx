import { ReactNode } from 'react'
import { Sidebar, Topbar } from './sidebar'
import { DashboardProvider } from './dashboard-context'

interface DashboardLayoutProps {
  children: ReactNode
  userRole: string
}

export default function DashboardLayout({ children, userRole }: DashboardLayoutProps) {
  return (
    <DashboardProvider>
      <div className="min-h-screen bg-gray-50">
        <Sidebar userRole={userRole} />
        <div className="lg:pl-64">
          <Topbar />
          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </DashboardProvider>
  )
}
