'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Menu, X, Package, ClipboardCheck, ArrowUp, ArrowDown, LogOut, User, FileText, TrendingUp, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useDashboard } from './dashboard-context'
import { bem } from '@/lib/bem'

interface SidebarProps {
  userRole: string
  userName: string
  userEmail: string
}

export function Sidebar({ userRole, userName, userEmail }: SidebarProps) {
  const { sidebarOpen, mobileMenuOpen, setSidebarOpen, setMobileMenuOpen } = useDashboard()
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return
    const touchEndX = e.touches[0].clientX
    const diff = touchStartX - touchEndX
    // Swipe left to close (diff > 50px)
    if (diff > 50 && mobileMenuOpen) {
      setMobileMenuOpen(false)
      setTouchStartX(null)
    }
  }

  const handleTouchEnd = () => {
    setTouchStartX(null)
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Package },
    { name: 'Data Barang', href: '/dashboard/items', icon: Package },
    { name: 'Stok Masuk', href: '/dashboard/stock-in', icon: ArrowUp },
    { name: 'Stok Keluar', href: '/dashboard/stock-out', icon: ArrowDown },
    { name: 'Penyesuaian Stok', href: '/dashboard/stock-adjustment', icon: ArrowUp },
    { name: 'Opname', href: '/dashboard/opname', icon: ClipboardCheck },
    { name: 'Laporan Stok', href: '/dashboard/reports/stock', icon: BarChart3 },
    { name: 'Stok Rendah', href: '/dashboard/reports/low-stock', icon: TrendingUp },
    { name: 'Mutasi Stok', href: '/dashboard/reports/mutation', icon: FileText },
  ]

  const bemBlock = bem('sidebar')

  return (
    <>
      {/* Mobile menu button */}
      <div className={bemBlock.e('mobile-header')}>
        <div className={bemBlock.e('mobile-header-content')}>
          <h1 className={bemBlock.e('mobile-header-title')}>Sistem Manajemen Stok</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className={bemBlock.e('mobile-overlay')}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className={bemBlock.e('mobile-menu')}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className={bemBlock.e('mobile-menu-content')}>
            <div className={bemBlock.e('mobile-menu-header')}>
              <h1 className={bemBlock.e('mobile-menu-title')}>Sistem Manajemen Stok</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className={bemBlock.e('mobile-menu-body')}>
              <nav className={bemBlock.e('mobile-menu-nav')}>
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={bemBlock.e('mobile-menu-nav-item')}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className={bemBlock.e('mobile-menu-nav-item-icon')} />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div
        className={cn(
          bemBlock.e('desktop'),
          !sidebarOpen && bemBlock.m('collapsed')
        )}
      >
        <div className={bemBlock.e('desktop-content')}>
          <div className={bemBlock.e('desktop-header')}>
            <h1 className={bemBlock.e('desktop-title')}>Sistem Manajemen Stok</h1>
            <Button
              variant="ghost"
              size="icon"
              className={bemBlock.e('desktop-menu-toggle')}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          <div className={bemBlock.e('desktop-body')}>
            <nav className={bemBlock.e('desktop-nav')}>
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={bemBlock.e('desktop-nav-item')}
                >
                  <item.icon className={bemBlock.e('desktop-nav-item-icon')} />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className={bemBlock.e('desktop-footer')}>
            <div className={bemBlock.e('desktop-user-info')}>
              <div className={bemBlock.e('desktop-user-avatar')}>
                <User className={bemBlock.e('desktop-user-avatar-icon')} />
              </div>
              <div className={bemBlock.e('desktop-user-details')}>
                <p className={bemBlock.e('desktop-user-name')}>{userName}</p>
                <p className={bemBlock.e('desktop-user-role')}>{userRole}</p>
              </div>
            </div>
            <Button variant="outline" className={bemBlock.e('desktop-logout-button')} onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' })
              window.location.href = '/login'
            }}>
              <LogOut className={bemBlock.e('desktop-logout-button-icon')} />
              Keluar
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

interface TopbarProps {
  userRole: string
  userName: string
  userEmail: string
}

export function Topbar({ userRole, userName, userEmail }: TopbarProps) {
  const { sidebarOpen, mobileMenuOpen, setSidebarOpen, setMobileMenuOpen } = useDashboard()

  const bemBlock = bem('topbar')

  return (
    <div className={bemBlock.b()}>
      <div className={bemBlock.e('header')}>
        <div className={bemBlock.e('header-left')}>
          <Button
            variant="ghost"
            size="icon"
            className={bemBlock.e('header-menu-toggle')}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        <div className={bemBlock.e('header-right')}>
          <div className={bemBlock.e('header-user-info')}>
            <div className={bemBlock.e('header-user-avatar')}>
              <User className={bemBlock.e('header-user-avatar-icon')} />
            </div>
            <div className={bemBlock.e('header-user-details')}>
              <p className={bemBlock.e('header-user-name')}>{userName}</p>
              <p className={bemBlock.e('header-user-role')}>{userRole}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
