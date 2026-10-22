"use client";

import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { itemSchema } from "@/lib/schemas";
import { UNIT_OPTIONS as UNITS } from "@/lib/constants";
import type { Item, ItemForm } from "./types";

interface ItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  editingItem: Item | null;
  form: UseFormReturn<ItemForm>;
  onSubmit: (data: ItemForm) => void;
  isSubmitting: boolean;
}

export function ItemFormDialog({
  open,
  onOpenChange,
  onCancel,
  editingItem,
  form,
  onSubmit,
  isSubmitting,
}: ItemFormDialogProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const watchedUnit = watch("unit");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingItem ? "Edit Barang" : "Tambah Barang"}
          </DialogTitle>
          <DialogDescription>
            {editingItem
              ? "Perbarui informasi barang"
              : "Isi form untuk menambahkan barang baru"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code">Kode Barang *</Label>
              <Input
                id="code"
                placeholder="SP-001"
                {...register("code")}
                disabled={!!editingItem}
              />
              {errors.code && (
                <p className="text-sm text-destructive">
                  {errors.code.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nama Barang *</Label>
              <Input id="name" placeholder="Filter Oli" {...register("name")} />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="unit">Satuan *</Label>
              <Select
                value={watchedUnit || "PCS"}
                onValueChange={(v: string) => setValue("unit", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih satuan" />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.unit && (
                <p className="text-sm text-destructive">
                  {errors.unit.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="minStock">Stok Minimum *</Label>
              <Input
                id="minStock"
                type="number"
                min="0"
                {...register("minStock")}
              />
              {errors.minStock && (
                <p className="text-sm text-destructive">
                  {errors.minStock.message}
                </p>
              )}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="currentStock">Stok Awal</Label>
              <Input
                id="currentStock"
                type="number"
                min="0"
                {...register("currentStock")}
              />
              {errors.currentStock && (
                <p className="text-sm text-destructive">
                  {errors.currentStock.message}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Input
              id="description"
              placeholder="Keterangan tambahan..."
              {...register("description")}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
