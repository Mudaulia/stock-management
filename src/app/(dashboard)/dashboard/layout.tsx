'use client'

import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Package,
  ArrowUp,
  ArrowDown,
  ClipboardCheck,
  FileText,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Data Barang', href: '/dashboard/items', icon: Package },
  { name: 'Stok Masuk', href: '/dashboard/stock-in', icon: ArrowUp },
  { name: 'Stok Keluar', href: '/dashboard/stock-out', icon: ArrowDown },
  { name: 'Stok Opname', href: '/dashboard/opname', icon: ClipboardCheck },
  { name: 'Laporan', href: '/dashboard/reports', icon: FileText },
  { name: 'Pengguna', href: '/dashboard/users', icon: Users, roles: ['ADMIN'] },
  { name: 'Pengaturan', href: '/dashboard/settings', icon: Settings, roles: ['ADMIN'] },
]

interface SidebarProps {
  children: ReactNode
  userRole: string
}

export default function DashboardLayout({ children, userRole }: SidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const filteredNavigation = navigation.filter(item => 
    !item.roles || item.roles.includes(userRole)
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen bg-white border-r border-gray-200 transition-all duration-300 lg:translate-x-0',
          sidebarOpen ? 'w-64' : 'w-20',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className={cn('flex h-16 items-center justify-between px-4 border-b border-gray-200', !sidebarOpen && 'justify-center')}>
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-primary" />
              {sidebarOpen && (
                <span className="text-xl font-bold text-gray-900">StokApp</span>
              )}
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4 overflow-y-auto" aria-label="Main navigation">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                    !sidebarOpen && 'justify-center'
                  )}
                  title={sidebarOpen ? undefined : item.name}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                  {sidebarOpen && <span>{item.name}</span>}
                </Link>
              )
            })}
          </nav>

          {/* User section & Logout */}
          <div className={cn('p-4 border-t border-gray-200', !sidebarOpen && 'items-center')}>
            <div className={cn('flex items-center space-x-3', !sidebarOpen && 'justify-center')}>
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
                {userRole.charAt(0)}
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{userRole}</p>
                  <p className="text-xs text-gray-500 truncate">User</p>
                </div>
              )}
            </div>
            {sidebarOpen && (
              <Button
                variant="ghost"
                className="w-full mt-2 justify-start"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Keluar
              </Button>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={cn('transition-all duration-300 lg:pl-64', sidebarOpen ? 'pl-64' : 'pl-20')}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200">
          <div className="flex h-full items-center justify-between px-4 sm:px-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:flex"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </Button>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}