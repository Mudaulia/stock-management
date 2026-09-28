"use client"

import { useToast as useToastPrimitive } from "@/components/ui/toast"
import { useCallback } from "react"

export function useToast() {
  const { toast, dismiss, toasts } = useToastPrimitive()

  const showSuccess = useCallback(
    (title: string, description?: string) => {
      toast({ title, description, variant: "success" })
    },
    [toast]
  )

  const showError = useCallback(
    (title: string, description?: string) => {
      toast({ title, description, variant: "destructive" })
    },
    [toast]
  )

  const showInfo = useCallback(
    (title: string, description?: string) => {
      toast({ title, description, variant: "default" })
    },
    [toast]
  )

  return { toast, dismiss, toasts, showSuccess, showError, showInfo }
}