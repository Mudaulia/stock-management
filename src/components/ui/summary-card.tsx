"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
  DollarSign,
  Users,
} from "lucide-react"

export interface SummaryCardProps {
  title: string
  value: string | number
  change?: string
  trend?: "up" | "down" | "neutral"
  icon?: React.ReactNode
  className?: string
  valueClassName?: string
}

const iconMap = {
  package: Package,
  trendingUp: TrendingUp,
  trendingDown: TrendingDown,
  alert: AlertTriangle,
  dollar: DollarSign,
  users: Users,
}

export function SummaryCard({
  title,
  value,
  change,
  trend = "neutral",
  icon,
  className,
  valueClassName,
}: SummaryCardProps) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : null
  const trendColor =
    trend === "up"
      ? "text-green-600"
      : trend === "down"
      ? "text-red-600"
      : "text-muted-foreground"

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", valueClassName)}>
          {value}
        </div>
        {change && (
          <p className="text-xs text-muted-foreground">
            <span className={cn("inline-flex items-center", trendColor)}>
              {TrendIcon && <TrendIcon className="h-3 w-3 mr-1" />}
              {change}
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// Predefined summary cards for common use cases
export function StockSummaryCard({
  title,
  value,
  change,
  trend,
  className,
}: Omit<SummaryCardProps, "icon"> & { className?: string }) {
  return (
    <SummaryCard
      title={title}
      value={value}
      change={change}
      trend={trend}
      icon={<Package className="h-4 w-4 text-muted-foreground" />}
      className={className}
    />
  )
}

export function LowStockSummaryCard({
  count,
  totalItems,
  className,
}: {
  count: number
  totalItems: number
  className?: string
}) {
  const percentage = totalItems > 0 ? Math.round((count / totalItems) * 100) : 0
  const trend: "up" | "down" | "neutral" =
    count > 0 ? "down" : "neutral"

  return (
    <SummaryCard
      title="Stok Rendah"
      value={count}
      change={percentage > 0 ? `${percentage}% dari total` : undefined}
      trend={trend}
      icon={<AlertTriangle className="h-4 w-4 text-orange-500" />}
      className={className}
    />
  )
}

export function ValueSummaryCard({
  title,
  value,
  change,
  trend,
  className,
}: Omit<SummaryCardProps, "icon"> & { className?: string }) {
  return (
    <SummaryCard
      title={title}
      value={value}
      change={change}
      trend={trend}
      icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
      className={className}
    />
  )
}
