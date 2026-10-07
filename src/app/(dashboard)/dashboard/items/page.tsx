"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  MoreHorizontal,
  AlertTriangle,
  Package,
} from "lucide-react"
;
import { cn } from "@/lib/utils";
import { useToast, Toaster } from "@/components/ui/toaster";
import { bem, bemVariant } from "@/lib/bem";
import { useItems, useCreateItem, useUpdateItem, useDeleteItem, useBulkDeleteItems, useExportItems } from "@/hooks/use-api";
import { itemSchema } from "@/lib/schemas";
import { SkeletonTable } from "@/components/ui/skeleton";
import { useKeyboardNavigation, useRowSelection, useUnsavedChangesWarning, useFormDirtyTracking } from "@/hooks";
import { EmptyState, NoData } from "@/components/ui/empty-state";

type ItemForm = z.infer<typeof itemSchema>;
type Item = z.infer<typeof itemSchema>;

const UNITS = ["PCS", "SET", "LITER", "UNIT", "METER", "KG", "BOX", "PACK"];

export default function ItemsPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [search, setSearch] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState<
    "all" | "true" | "false"
  >("all");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ItemForm>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      code: "",
      name: "",
      unit: "PCS",
      minStock: 0,
      currentStock: 0,
      description: "",
    },
  });

  const watchedUnit = watch("unit");

  // React Query hooks
  const { data: itemsData, isLoading, refetch } = useItems({
    page: pagination.page,
    limit: pagination.limit,
    search,
    isActive: isActiveFilter !== "all" ? isActiveFilter === "true" : undefined,
  });

  const createMutation = useCreateItem({
    onSuccess: () => {
      showSuccess("Berhasil ditambahkan");
      setIsDialogOpen(false);
      refetch();
    },
    onError: (err) => showError("Error", err.message),
  });

  const updateMutation = useUpdateItem({
    onSuccess: () => {
      showSuccess("Berhasil diupdate");
      setIsDialogOpen(false);
      refetch();
    },
    onError: (err) => showError("Error", err.message),
  });

  const deleteMutation = useDeleteItem({
    onSuccess: () => {
      showSuccess("Berhasil dihapus");
      setDeleteConfirm(null);
      refetch();
    },
    onError: (err) => showError("Error", err.message),
  });

  const bulkDeleteMutation = useBulkDeleteItems({
    onSuccess: () => {
      showSuccess("Berhasil menghapus item terpilih");
      clearSelection();
      refetch();
    },
    onError: (err) => showError("Error", err.message),
  });

  const exportMutation = useExportItems({
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `items-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      showSuccess("Berhasil mengekspor data")
    },
    onError: (err) => showError("Error", err.message),
  });

  const items = itemsData?.data ?? [];
  const paginationData = itemsData?.pagination;

  // Keyboard navigation
  const { tableRef, selectedIndex, setSelectedIndex } = useKeyboardNavigation<Item>({
    rowCount: items.length,
    enabled: !isLoading && items.length > 0,
  });

  // Row selection for bulk actions
  const { selectedIds, selectedCount, toggleRow, toggleAll, clearSelection, isSelected } = useRowSelection<Item>();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
  };

  const handlePageChange = (page: number) => {
    setPagination({ ...pagination, page });
  };

  const handleLimitChange = (limit: number) => {
    setPagination({ ...pagination, limit, page: 1 });
  };

  const openCreateDialog = () => {
    reset({
      code: "",
      name: "",
      unit: "PCS",
      minStock: 0,
      currentStock: 0,
      description: "",
    });
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: Item) => {
    reset({
      code: item.code,
      name: item.name,
      unit: item.unit,
      minStock: item.minStock,
      currentStock: item.currentStock,
      description: item.description || "",
    });
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: ItemForm) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleBulkDelete = () => {
    if (selectedCount === 0) return
    if (confirm(`Yakin ingin menghapus ${selectedCount} item terpilih?`)) {
      bulkDeleteMutation.mutate(Array.from(selectedIds))
    }
  }

  const handleExport = () => {
    exportMutation.mutate({ ids: Array.from(selectedIds), params: { search, isActive: isActiveFilter !== "all" ? isActiveFilter === "true" : undefined } })
  }

  // Track form dirty state for unsaved changes warning
  const formValues = watch()
  const initialFormValues = {
    code: "",
    name: "",
    unit: "PCS",
    minStock: 0,
    currentStock: 0,
    description: "",
  }
  // Only track the form fields we care about
  const trackedFormValues = {
    code: formValues.code ?? "",
    name: formValues.name ?? "",
    unit: formValues.unit ?? "PCS",
    minStock: formValues.minStock ?? 0,
    currentStock: formValues.currentStock ?? 0,
    description: formValues.description ?? "",
  }
  const isFormDirty = useFormDirtyTracking(initialFormValues, trackedFormValues)

  // Unsaved changes warning for dialog
  const { confirmLeave } = useUnsavedChangesWarning({
    isDirty: isFormDirty && isDialogOpen,
    message: 'Anda memiliki perubahan yang belum disimpan. Yakin ingin menutup dialog ini?',
  })

  const handleDialogClose = async () => {
    const confirmed = await confirmLeave()
    if (confirmed) {
      setIsDialogOpen(false)
    }
  }

  const getStockStatus = (item: Item) => {
    if (item.currentStock <= 0)
      return { label: "Habis", className: "bg-red-100 text-red-800" };
    if (item.currentStock <= item.minStock)
      return { label: "Minimum", className: "bg-yellow-100 text-yellow-800" };
    return { label: "Normal", className: "bg-green-100 text-green-800" };
  };

  return (
    <div className="space-y-6">
      <Toaster />

      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Data Barang</h1>
          <p className="text-gray-500 mt-1">Kelola master data sparepart</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Barang
        </Button>
      </div>

      {/* Search & Filter */}
      <Card>
        <CardContent className="pt-6">
          <form
            onSubmit={handleSearch}
            className="flex flex-col sm:flex-row gap-4"
          >
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Cari kode atau nama barang..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={isActiveFilter}
              onValueChange={(value: string) =>
                setIsActiveFilter(value as "all" | "true" | "false")
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="true">Aktif</SelectItem>
                <SelectItem value="false">Nonaktif</SelectItem>
              </SelectContent>
            </Select>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-0">
          {isLoading ? (
            <SkeletonTable rows={5} columns={9} />
          ) : items.length === 0 ? (
            <NoData
              title="Belum ada data barang"
              description="Mulai dengan menambahkan barang pertama Anda."
              actionLabel="Tambah Barang Pertama"
              onAction={openCreateDialog}
            />
          ) : (
            <>
              {/* Bulk Actions Bar */}
              {selectedCount > 0 && (
                <div className="mb-4 flex items-center justify-between p-4 bg-muted rounded-lg">
                  <span className="text-sm font-medium">
                    {selectedCount} item terpilih
                  </span>
                  <div className="flex gap-2">
                    <Button variant="destructive" size="sm" onClick={handleBulkDelete} disabled={bulkDeleteMutation.isPending}>
                      {bulkDeleteMutation.isPending ? 'Menghapus...' : 'Hapus Terpilih'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExport} disabled={exportMutation.isPending}>
                      {exportMutation.isPending ? 'Mengekspor...' : 'Ekspor CSV'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={clearSelection}>
                      Batal
                    </Button>
                  </div>
                </div>
              )}
              <div className="items__table-container" ref={tableRef} tabIndex={0}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="items__table-cell items__table-cell--select w-12">
                        <input
                          type="checkbox"
                          checked={selectedCount === items.length && items.length > 0}
                          onChange={() => toggleAll(items.map(i => i.id))}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          aria-label="Pilih semua"
                        />
                      </TableHead>
                      <TableHead className="items__table-cell items__table-cell--index">#{' '}</TableHead>
                      <TableHead className="items__table-cell items__table-cell--code">Kode</TableHead>
                      <TableHead className="items__table-cell items__table-cell--name">Nama Barang</TableHead>
                      <TableHead className="items__table-cell items__table-cell--unit">Satuan</TableHead>
                      <TableHead className="items__table-cell items__table-cell--stock items__table-cell--number">Stok</TableHead>
                      <TableHead className="items__table-cell items__table-cell--min items__table-cell--number">Min</TableHead>
                      <TableHead className="items__table-cell items__table-cell--status">Status</TableHead>
                      <TableHead className="items__table-cell items__table-cell--actions">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => {
                      const status = getStockStatus(item);
                      const globalIndex =
                        (pagination.page - 1) * pagination.limit + index + 1;
                      const rowSelected = isSelected(item.id);
                      return (
                        <TableRow
                          key={item.id}
                          className={cn("items__table-row", rowSelected && "bg-primary/5")}
                          data-selected={rowSelected}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              toggleRow(item.id);
                            }
                          }}
                          onClick={(e) => {
                            // Don't toggle selection if clicking on dropdown or interactive elements
                            if (!(e.target as HTMLElement).closest('[role="menu"], button, input, a')) {
                              toggleRow(item.id);
                            }
                          }}
                        >
                          <TableCell className="items__table-cell items__table-cell--select">
                            <input
                              type="checkbox"
                              checked={rowSelected}
                              onChange={() => toggleRow(item.id)}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              aria-label={`Pilih ${item.name}`}
                            />
                          </TableCell>
                          <TableCell className="items__table-cell items__table-cell--index">
                            {globalIndex}
                          </TableCell>
                          <TableCell className="items__table-cell items__table-cell--code items__table-cell--code-mono">
                            {item.code}
                          </TableCell>
                          <TableCell className="items__table-cell items__table-cell--name">
                            <div className="items__item-name">{item.name}</div>
                            {item.description && (
                              <div className="items__item-description">
                                {item.description}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="items__table-cell items__table-cell--unit">{item.unit}</TableCell>
                          <TableCell className="items__table-cell items__table-cell--stock items__table-cell--number items__table-cell--stock-mono">
                            {item.currentStock.toLocaleString()}
                          </TableCell>
                          <TableCell className="items__table-cell items__table-cell--min items__table-cell--number items__table-cell--min-mono">
                            {item.minStock.toLocaleString()}
                          </TableCell>
                          <TableCell className="items__table-cell items__table-cell--status">
                            <span
                              className={cn(
                                "items__badge",
                                status.className,
                              )}
                            >
                              {status.label}
                            </span>
                          </TableCell>
                          <TableCell className="items__table-cell items__table-cell--actions">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="items__action-button"
                                >
                                  <MoreHorizontal className="items__action-button-icon" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditDialog(item);
                                  }}
                                >
                                  <Edit className="items__dropdown-icon" />
                                  Edit
                                </DropdownMenuItem>
                                {item.isActive && (
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteConfirm(item.id);
                                    }}
                                    className="items__dropdown-item--danger items__dropdown-item--danger-text"
                                  >
                                    <Trash2 className="items__dropdown-icon" />
                                    Hapus
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="flex items-center justify-between"
                      >
                        <div className="text-sm text-gray-500">
                          Menampilkan{" "}
                          {(pagination.page - 1) * pagination.limit + 1} -{" "}
                          {Math.min(
                            pagination.page * pagination.limit,
                            paginationData?.total ?? pagination.total,
                          )}{" "}
                          dari {paginationData?.total ?? pagination.total}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Select
                            value={pagination.limit.toString()}
                            onValueChange={(v) => handleLimitChange(parseInt(v))}
                          >
                            <SelectTrigger className="w-[100px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="10">10 per halaman</SelectItem>
                              <SelectItem value="25">25 per halaman</SelectItem>
                              <SelectItem value="50">50 per halaman</SelectItem>
                              <SelectItem value="100">100 per halaman</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page === 1}
                          >
                            Sebelumnya
                          </Button>
                          <span className="items__page-indicator">
                            Halaman {pagination.page} dari {paginationData?.totalPages ?? pagination.totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={pagination.page >= (paginationData?.totalPages ?? pagination.totalPages)}
                          >
                            Selanjutnya
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
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
                <Input
                  id="name"
                  placeholder="Filter Oli"
                  {...register("name")}
                />
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
                  onValueChange={(v: string) =>
                    setValue("unit", v)
                  }
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
                onClick={() => setIsDialogOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) ? (
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirm}
        onOpenChange={(open: boolean) =>
          !open && setDeleteConfirm(null)
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Barang</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus barang ini? Data akan
              dinonaktifkan (soft delete).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
