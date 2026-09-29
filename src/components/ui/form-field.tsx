"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface FormFieldProps {
  label: string
  htmlFor: string
  error?: string
  required?: boolean
  className?: string
  children?: React.ReactNode
}

export interface FormFieldInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  htmlFor: string
  error?: string
  required?: boolean
  icon?: React.ReactNode
}

export interface FormFieldSelectProps {
  label: string
  htmlFor: string
  error?: string
  required?: boolean
  placeholder?: string
  items: { value: string; label: string }[]
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
}

/**
 * Generic form field wrapper that standardizes the Label + control + error pattern.
 * Use this when you need custom children (e.g., a custom Select or DatePicker).
 */
export function FormField({
  label,
  htmlFor,
  error,
  required = false,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}

/**
 * Form field with a standard Input control.
 * Includes optional icon support and consistent error display.
 */
export function FormFieldInput({
  label,
  htmlFor,
  error,
  required = false,
  className,
  icon,
  ...props
}: FormFieldInputProps) {
  return (
    <FormField
      label={label}
      htmlFor={htmlFor}
      error={error}
      required={required}
      className={className}
    >
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4">
            {icon}
          </span>
        )}
        <Input
          id={htmlFor}
          className={cn(icon && "pl-10")}
          {...props}
        />
      </div>
    </FormField>
  )
}

/**
 * Form field with a standard Select control.
 * Includes consistent error display and placeholder support.
 */
export function FormFieldSelect({
  label,
  htmlFor,
  error,
  required = false,
  placeholder = "Pilih...",
  items,
  value,
  onValueChange,
  disabled,
}: FormFieldSelectProps) {
  return (
    <FormField
      label={label}
      htmlFor={htmlFor}
      error={error}
      required={required}
    >
      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectTrigger id={htmlFor}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  )
}
