'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Plus, ArrowUp, ArrowDown, ClipboardCheck } from 'lucide-react'
import Link from 'next/link'

interface ActionButtonProps {
  label: string
  icon: React.ElementType
  href: string
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

function ActionButton({ label, icon: Icon, href, variant = 'outline', size = 'default', className }: ActionButtonProps) {
  return (
    <Link href={href}>
      <Button variant={variant} size={size} className={cn('gap-2', className)}>
        <Icon className="h-4 w-4" aria-hidden="true" />
        {label}
      </Button>
    </Link>
  )
}

interface ActionButtonsProps {
  className?: string
}

export function ActionButtons({ className }: ActionButtonsProps) {
  const actions = [
    { label: 'Tambah Barang', icon: Plus, href: '/dashboard/items', variant: 'default' as const },
    { label: 'Stok Masuk', icon: ArrowUp, href: '/dashboard/stock-in', variant: 'outline' as const },
    { label: 'Stok Keluar', icon: ArrowDown, href: '/dashboard/stock-out', variant: 'outline' as const },
    { label: 'Opname', icon: ClipboardCheck, href: '/dashboard/opname', variant: 'outline' as const },
  ]

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {actions.map((action) => (
        <ActionButton key={action.label} {...action} />
      ))}
    </div>
  )
}