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
        <div className="transition-all duration-300 lg:pl-64 pl-64">
          <Topbar />
          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
        <Sidebar userRole={userRole} />
      </div>
    </DashboardProvider>
  )
}
