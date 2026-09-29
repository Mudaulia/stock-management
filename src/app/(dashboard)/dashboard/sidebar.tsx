'use client'

import { useState } from 'react'
import { Menu, X, Package, ClipboardCheck, ArrowUp, ArrowDown, LogOut, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDashboard } from './dashboard-context'
import { bem } from '@/lib/bem'

interface SidebarProps {
  userRole: string
}

export function Sidebar({ userRole }: SidebarProps) {
  const { sidebarOpen, mobileMenuOpen, setSidebarOpen, setMobileMenuOpen } = useDashboard()
  const [searchQuery, setSearchQuery] = useState('')

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Package },
    { name: 'Stok Masuk', href: '/dashboard/stock-in', icon: ArrowUp },
    { name: 'Stok Keluar', href: '/dashboard/stock-out', icon: ArrowDown },
    { name: 'Opname', href: '/dashboard/opname', icon: ClipboardCheck },
  ]

  const filteredNavigation = navigation.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const bemBlock = bem('sidebar')

  return (
    <>
      {/* Mobile menu button */}
      <div className={bemBlock('mobile-header')}>
        <div className={bemBlock('mobile-header-content')}>
          <h1 className={bemBlock('mobile-header-title')}>Sistem Manajemen Stok</h1>
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
          className={bemBlock('mobile-overlay')}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className={bemBlock('mobile-menu')}>
          <div className={bemBlock('mobile-menu-content')}>
            <div className={bemBlock('mobile-menu-header')}>
              <h1 className={bemBlock('mobile-menu-title')}>Sistem Manajemen Stok</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className={bemBlock('mobile-menu-body')}>
              <div className={bemBlock('mobile-menu-search')}>
                <Input
                  placeholder="Cari..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={bemBlock('mobile-menu-search-input')}
                />
              </div>
              <nav className={bemBlock('mobile-menu-nav')}>
                {filteredNavigation.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className={bemBlock('mobile-menu-nav-item')}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className={bemBlock('mobile-menu-nav-item-icon')} />
                    {item.name}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div
        className={cn(
          bemBlock('desktop'),
          !sidebarOpen && bemBlock('desktop', 'collapsed')
        )}
      >
        <div className={bemBlock('desktop-content')}>
          <div className={bemBlock('desktop-header')}>
            <h1 className={bemBlock('desktop-title')}>Sistem Manajemen Stok</h1>
            <Button
              variant="ghost"
              size="icon"
              className={bemBlock('desktop-menu-toggle')}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          <div className={bemBlock('desktop-body')}>
            <div className={bemBlock('desktop-search')}>
              <Input
                placeholder="Cari..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={bemBlock('desktop-search-input')}
              />
            </div>
            <nav className={bemBlock('desktop-nav')}>
              {filteredNavigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className={bemBlock('desktop-nav-item')}
                >
                  <item.icon className={bemBlock('desktop-nav-item-icon')} />
                  {item.name}
                </a>
              ))}
            </nav>
          </div>
          <div className={bemBlock('desktop-footer')}>
            <div className={bemBlock('desktop-user-info')}>
              <div className={bemBlock('desktop-user-avatar')}>
                <User className={bemBlock('desktop-user-avatar-icon')} />
              </div>
              <div className={bemBlock('desktop-user-details')}>
                <p className={bemBlock('desktop-user-name')}>Admin</p>
                <p className={bemBlock('desktop-user-role')}>{userRole}</p>
              </div>
            </div>
            <Button variant="outline" className={bemBlock('desktop-logout-button')} onClick={() => {
              window.location.href = '/api/auth/logout'
            }}>
              <LogOut className={bemBlock('desktop-logout-button-icon')} />
              Keluar
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

interface TopbarProps {
  // No props needed - uses context
}

export function Topbar({ }: TopbarProps) {
  const { sidebarOpen, mobileMenuOpen, setSidebarOpen, setMobileMenuOpen } = useDashboard()

  const bemBlock = bem('topbar')

  return (
    <div className={bemBlock()}>
      <div className={bemBlock('header')}>
        <div className={bemBlock('header-left')}>
          <Button
            variant="ghost"
            size="icon"
            className={bemBlock('header-menu-toggle')}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className={bemBlock('header-title')}>Dashboard</h1>
        </div>
        <div className={bemBlock('header-right')}>
          <div className={bemBlock('header-user-info')}>
            <div className={bemBlock('header-user-avatar')}>
              <User className={bemBlock('header-user-avatar-icon')} />
            </div>
            <div className={bemBlock('header-user-details')}>
              <p className={bemBlock('header-user-name')}>Admin</p>
              <p className={bemBlock('header-user-role')}>Administrator</p>
            </div>
          </div>
          <Button variant="outline" className={bemBlock('header-logout-button')} onClick={() => {
            window.location.href = '/api/auth/logout'
          }}>
            <LogOut className={bemBlock('header-logout-button-icon')} />
            Keluar
          </Button>
        </div>
      </div>
    </div>
  )
}
