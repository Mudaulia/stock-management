"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Download, FileText } from "lucide-react"

export interface PageHeaderProps {
  title: string
  description?: string
  actionLabel?: string
  actionIcon?: React.ReactNode
  onAction?: () => void
  actionVariant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
  secondaryActionLabel?: string
  secondaryActionIcon?: React.ReactNode
  onSecondaryAction?: () => void
  secondaryActionVariant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
  className?: string
}

export function PageHeader({
  title,
  description,
  actionLabel,
  actionIcon,
  onAction,
  actionVariant = "default",
  secondaryActionLabel,
  secondaryActionIcon,
  onSecondaryAction,
  secondaryActionVariant = "outline",
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4",
        className
      )}
    >
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {secondaryActionLabel && onSecondaryAction && (
          <Button
            variant={secondaryActionVariant}
            onClick={onSecondaryAction}
          >
            {secondaryActionIcon}
            {secondaryActionLabel}
          </Button>
        )}
        {actionLabel && onAction && (
          <Button variant={actionVariant} onClick={onAction}>
            {actionIcon || <Plus className="h-4 w-4 mr-2" />}
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  )
}

export function SectionHeader({
  title,
  description,
  actionLabel,
  actionIcon,
  onAction,
  className,
}: Omit<PageHeaderProps, "secondaryActionLabel" | "secondaryActionIcon" | "onSecondaryAction" | "actionVariant" | "secondaryActionVariant"> & {
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4",
        className
      )}
    >
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionIcon}
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
