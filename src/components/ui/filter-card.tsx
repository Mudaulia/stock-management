"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Filter, X } from "lucide-react"

export interface FilterOption {
  key: string
  label: string
  value: string
  options: { value: string; label: string }[]
}

export interface FilterCardProps {
  title?: string
  filters: FilterOption[]
  values: Record<string, string>
  onChange: (key: string, value: string) => void
  onClear?: () => void
  onApply?: () => void
  showApplyButton?: boolean
  showClearButton?: boolean
  className?: string
}

export function FilterCard({
  title = "Filter",
  filters,
  values,
  onChange,
  onClear,
  onApply,
  showApplyButton = true,
  showClearButton = true,
  className,
}: FilterCardProps) {
  const hasActiveFilters = Object.values(values).some((v) => v !== "")

  return (
    <Card className={cn("mb-4", className)}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center">
          <Filter className="h-4 w-4 mr-2" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filters.map((filter) => (
            <div key={filter.key} className="space-y-2">
              <label className="text-sm font-medium">{filter.label}</label>
              <select
                value={values[filter.key] || ""}
                onChange={(e) => onChange(filter.key, e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Semua</option>
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {(showApplyButton || showClearButton) && (
          <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t">
            {showClearButton && hasActiveFilters && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClear}
              >
                <X className="h-4 w-4 mr-1" />
                Reset
              </Button>
            )}
            {showApplyButton && onApply && (
              <Button type="button" size="sm" onClick={onApply}>
                Terapkan
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
