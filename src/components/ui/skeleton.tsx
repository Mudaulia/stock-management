"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export function SkeletonText({
  className,
  lines = 3,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { lines?: number }) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  )
}

export function SkeletonTableRow({
  columns = 8,
  className,
}: {
  columns?: number
  className?: string
}) {
  return (
    <tr className={cn("border-b animate-pulse", className)}>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4 align-middle">
          <Skeleton className="h-4 w-[100px]" />
        </td>
      ))}
    </tr>
  )
}

export function SkeletonTable({
  rows = 5,
  columns = 8,
  className,
}: {
  rows?: number
  columns?: number
  className?: string
}) {
  return (
    <div className={cn("relative w-full overflow-auto", className)}>
      <table className="w-full caption-bottom text-sm">
        <thead>
          <tr className="border-b">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                <Skeleton className="h-4 w-[80px]" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <SkeletonTableRow key={rowIndex} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function SkeletonCard({
  className,
  lines = 3,
}: {
  className?: string
  lines?: number
}) {
  return (
    <div className={cn("rounded-lg border bg-card p-6", className)}>
      <Skeleton className="h-6 w-1/4 mb-4" />
      <SkeletonText lines={lines} />
    </div>
  )
}

export function SkeletonStatCard({
  className,
}: {
  className?: string
}) {
  return (
    <div className={cn("rounded-lg border bg-card p-6", className)}>
      <Skeleton className="h-4 w-1/3 mb-2" />
      <Skeleton className="h-8 w-1/2" />
    </div>
  )
}

export { Skeleton }