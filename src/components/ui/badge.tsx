"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        success: "bg-green-100 text-green-800",
        warning: "bg-yellow-100 text-yellow-800",
        destructive: "bg-red-100 text-red-800",
        outline: "border border-input bg-background text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

// Predefined status badges for common use cases
export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase()

  if (normalized.includes("selesai") || normalized.includes("complete")) {
    return <Badge variant="success">{status}</Badge>
  }
  if (normalized.includes("pending") || normalized.includes("menunggu")) {
    return <Badge variant="warning">{status}</Badge>
  }
  if (normalized.includes("gagal") || normalized.includes("error") || normalized.includes("reject")) {
    return <Badge variant="destructive">{status}</Badge>
  }
  return <Badge variant="secondary">{status}</Badge>
}

export function StockStatusBadge({ level }: { level: "low" | "normal" | "high" }) {
  switch (level) {
    case "low":
      return <Badge variant="destructive">Stok Rendah</Badge>
    case "high":
      return <Badge variant="success">Stok Tinggi</Badge>
    default:
      return <Badge variant="secondary">Stok Normal</Badge>
  }
}

export { Badge, badgeVariants }
