'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

interface UseUnsavedChangesOptions {
  isDirty: boolean
  message?: string
  onConfirmLeave?: () => void
}

export function useUnsavedChangesWarning({
  isDirty,
  message = 'Anda memiliki perubahan yang belum disimpan. Yakin ingin meninggalkan halaman ini?',
  onConfirmLeave,
}: UseUnsavedChangesOptions) {
  const { showInfo } = useToast()
  const isUnloadingRef = useRef(false)
  const confirmedRef = useRef(false)

  // Handle browser close/refresh/navigation
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isDirty && !confirmedRef.current) {
        event.preventDefault()
        event.returnValue = message
        return message
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty, message])

  // Handle internal navigation (Next.js router)
  const confirmLeave = useCallback(() => {
    if (!isDirty || confirmedRef.current) return Promise.resolve(true)

    return new Promise<boolean>((resolve) => {
      // Use a simple confirm dialog for internal navigation
      const confirmed = window.confirm(message)
      if (confirmed) {
        confirmedRef.current = true
        onConfirmLeave?.()
        resolve(true)
      } else {
        resolve(false)
      }
    })
  }, [isDirty, message, onConfirmLeave])

  // Reset confirmed flag when dirty state changes
  useEffect(() => {
    if (!isDirty) {
      confirmedRef.current = false
    }
  }, [isDirty])

  return { confirmLeave }
}

// Hook for form dirty tracking
export function useFormDirtyTracking<T extends Record<string, unknown>>(
  initialValues: T,
  currentValues: Partial<T>
): boolean {
  const initialRef = useRef(initialValues)
  
  // Update initial ref when initialValues change (e.g., after successful submit)
  useEffect(() => {
    initialRef.current = initialValues
  }, [initialValues])

  // Compare current values with initial values
  const isDirty = Object.keys(currentValues).some(
    (key) => currentValues[key] !== initialRef.current[key]
  )

  return isDirty
}