"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Trash2, LogOut } from "lucide-react"

export interface ConfirmDialogProps {
  trigger?: React.ReactNode
  triggerLabel?: string
  triggerVariant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
  title: string
  description?: string
  actionLabel?: string
  cancelLabel?: string
  actionVariant?: "default" | "destructive"
  onConfirm?: () => void | Promise<void>
  destructive?: boolean
  icon?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ConfirmDialog({
  trigger,
  triggerLabel = "Konfirmasi",
  triggerVariant = "default",
  title,
  description,
  actionLabel = "Ya, Lanjutkan",
  cancelLabel = "Batal",
  actionVariant = "default",
  onConfirm,
  destructive = false,
  icon,
  open,
  onOpenChange,
}: ConfirmDialogProps) {
  const [isProcessing, setIsProcessing] = React.useState(false)

  const handleConfirm = async () => {
    if (!onConfirm) return
    setIsProcessing(true)
    try {
      await onConfirm()
    } finally {
      setIsProcessing(false)
    }
  }

  const dialogContent = (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle className="flex items-center gap-2">
          {icon || (destructive ? (
            <AlertTriangle className="h-5 w-5 text-destructive" />
          ) : null)}
          {title}
        </AlertDialogTitle>
        {description && (
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        )}
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={isProcessing}>
          {cancelLabel}
        </AlertDialogCancel>
        <AlertDialogAction asChild>
          <Button
            variant={destructive ? "destructive" : actionVariant}
            onClick={handleConfirm}
            disabled={isProcessing}
          >
            {actionLabel}
          </Button>
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  )

  if (open !== undefined && onOpenChange) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        {dialogContent}
      </AlertDialog>
    )
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger !== undefined ? (
          trigger
        ) : (
          <Button variant={triggerVariant}>
            {triggerLabel}
          </Button>
        )}
      </AlertDialogTrigger>
      {dialogContent}
    </AlertDialog>
  )
}

// Predefined confirm dialogs for common use cases
export function DeleteConfirmDialog({
  onConfirm,
  itemName,
  ...props
}: Omit<ConfirmDialogProps, "onConfirm" | "title" | "description" | "destructive" | "icon"> & {
  onConfirm: () => void | Promise<void>
  itemName?: string
}) {
  return (
    <ConfirmDialog
      {...props}
      title="Hapus Data"
      description={
        itemName
          ? `Apakah Anda yakin ingin menghapus "${itemName}"? Tindakan ini tidak dapat dibatalkan.`
          : "Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan."
      }
      destructive
      icon={<Trash2 className="h-5 w-5 text-destructive" />}
      actionLabel="Ya, Hapus"
      onConfirm={onConfirm}
    />
  )
}

export function LogoutConfirmDialog({
  onConfirm,
  ...props
}: Omit<ConfirmDialogProps, "onConfirm" | "title" | "description" | "destructive" | "icon"> & {
  onConfirm: () => void | Promise<void>
}) {
  return (
    <ConfirmDialog
      {...props}
      title="Keluar"
      description="Apakah Anda yakin ingin keluar dari akun ini?"
      destructive
      icon={<LogOut className="h-5 w-5 text-destructive" />}
      actionLabel="Ya, Keluar"
      onConfirm={onConfirm}
    />
  )
}
