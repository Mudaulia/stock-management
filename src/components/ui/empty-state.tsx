"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Package,
  Search,
  FileText,
  AlertCircle,
} from "lucide-react"

export interface EmptyStateProps {
  title?: string
  description?: string
  icon?: React.ReactNode
  actionLabel?: string
  onAction?: () => void
  className?: string
}

const iconMap = {
  package: Package,
  search: Search,
  file: FileText,
  alert: AlertCircle,
}

export function EmptyState({
  title = "Tidak ada data",
  description = "Belum ada data yang tersedia.",
  icon,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  const Icon = icon || <Package className="h-12 w-12 text-muted-foreground/50" />

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-4",
        className
      )}
    >
      <div className="mb-4">{Icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

// Predefined empty states for common use cases
export function NoSearchResults({
  onReset,
  className,
}: {
  onReset?: () => void
  className?: string
}) {
  return (
    <EmptyState
      title="Tidak ada hasil pencarian"
      description="Coba gunakan kata kunci yang berbeda atau periksa filter Anda."
      icon={<Search className="h-12 w-12 text-muted-foreground/50" />}
      actionLabel={onReset ? "Reset Pencarian" : undefined}
      onAction={onReset}
      className={className}
    />
  )
}

export function NoData({
  title = "Belum ada data",
  description = "Data akan muncul setelah Anda menambahkan entri baru.",
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <EmptyState
      title={title}
      description={description}
      icon={<FileText className="h-12 w-12 text-muted-foreground/50" />}
      actionLabel={actionLabel}
      onAction={onAction}
      className={className}
    />
  )
}
