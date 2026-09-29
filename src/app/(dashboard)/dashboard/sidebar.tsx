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
        <div className={bemBlock.e('mobile-menu')}>
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
              <div className={bemBlock.e('mobile-menu-search')}>
                <Input
                  placeholder="Cari..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={bemBlock.e('mobile-menu-search-input')}
                />
              </div>
              <nav className={bemBlock.e('mobile-menu-nav')}>
                {filteredNavigation.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className={bemBlock.e('mobile-menu-nav-item')}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className={bemBlock.e('mobile-menu-nav-item-icon')} />
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
            <div className={bemBlock.e('desktop-search')}>
              <Input
                placeholder="Cari..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={bemBlock.e('desktop-search-input')}
              />
            </div>
            <nav className={bemBlock.e('desktop-nav')}>
              {filteredNavigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className={bemBlock.e('desktop-nav-item')}
                >
                  <item.icon className={bemBlock.e('desktop-nav-item-icon')} />
                  {item.name}
                </a>
              ))}
            </nav>
          </div>
          <div className={bemBlock.e('desktop-footer')}>
            <div className={bemBlock.e('desktop-user-info')}>
              <div className={bemBlock.e('desktop-user-avatar')}>
                <User className={bemBlock.e('desktop-user-avatar-icon')} />
              </div>
              <div className={bemBlock.e('desktop-user-details')}>
                <p className={bemBlock.e('desktop-user-name')}>Admin</p>
                <p className={bemBlock.e('desktop-user-role')}>{userRole}</p>
              </div>
            </div>
            <Button variant="outline" className={bemBlock.e('desktop-logout-button')} onClick={() => {
              window.location.href = '/api/auth/logout'
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
  // No props needed - uses context
}

export function Topbar({ }: TopbarProps) {
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
          <h1 className={bemBlock.e('header-title')}>Dashboard</h1>
        </div>
        <div className={bemBlock.e('header-right')}>
          <div className={bemBlock.e('header-user-info')}>
            <div className={bemBlock.e('header-user-avatar')}>
              <User className={bemBlock.e('header-user-avatar-icon')} />
            </div>
            <div className={bemBlock.e('header-user-details')}>
              <p className={bemBlock.e('header-user-name')}>Admin</p>
              <p className={bemBlock.e('header-user-role')}>Administrator</p>
            </div>
          </div>
          <Button variant="outline" className={bemBlock.e('header-logout-button')} onClick={() => {
            window.location.href = '/api/auth/logout'
          }}>
            <LogOut className={bemBlock.e('header-logout-button-icon')} />
            Keluar
          </Button>
        </div>
      </div>
    </div>
  )
}
