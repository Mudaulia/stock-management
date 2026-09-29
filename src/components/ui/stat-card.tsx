"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react"

export interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  className?: string
  valueClassName?: string
}

const iconMap = {
  package: Package,
  trendingUp: TrendingUp,
  trendingDown: TrendingDown,
  alert: AlertTriangle,
  check: CheckCircle,
  clock: Clock,
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  className,
  valueClassName,
}: StatCardProps) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : null
  const trendColor =
    trend === "up"
      ? "text-green-600"
      : trend === "down"
      ? "text-red-600"
      : "text-muted-foreground"

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              {title}
            </p>
            <div className={cn("text-2xl font-bold", valueClassName)}>
              {value}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trendValue && TrendIcon && (
              <p className={cn("text-xs", trendColor)}>
                <TrendIcon className="h-3 w-3 inline mr-1" />
                {trendValue}
              </p>
            )}
          </div>
          {icon}
        </div>
      </CardContent>
    </Card>
  )
}

// Predefined stat cards for inventory use cases
export function InventoryStatCard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  className,
}: Omit<StatCardProps, "icon"> & { className?: string }) {
  return (
    <StatCard
      title={title}
      value={value}
      subtitle={subtitle}
      trend={trend}
      trendValue={trendValue}
      icon={<Package className="h-4 w-4 text-muted-foreground" />}
      className={className}
    />
  )
}

export function AlertStatCard({
  title,
  value,
  subtitle,
  className,
}: Omit<StatCardProps, "icon"> & { className?: string }) {
  return (
    <StatCard
      title={title}
      value={value}
      subtitle={subtitle}
      icon={<AlertTriangle className="h-4 w-4 text-orange-500" />}
      className={className}
    />
  )
}

export function SuccessStatCard({
  title,
  value,
  subtitle,
  className,
}: Omit<StatCardProps, "icon"> & { className?: string }) {
  return (
    <StatCard
      title={title}
      value={value}
      subtitle={subtitle}
      icon={<CheckCircle className="h-4 w-4 text-green-500" />}
      className={className}
    />
  )
}
