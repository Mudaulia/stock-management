"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface TableWrapperProps {
  children: React.ReactNode
  className?: string
  scrollable?: boolean
}

/**
 * Wrapper for tables that provides responsive horizontal scrolling
 * and consistent styling.
 */
export function TableWrapper({
  children,
  className,
  scrollable = true,
}: TableWrapperProps) {
  if (!scrollable) {
    return (
      <div className={cn("rounded-md border", className)}>
        {children}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "rounded-md border overflow-x-auto",
        className
      )}
    >
      <div className="min-w-full">
        {children}
      </div>
    </div>
  )
}
