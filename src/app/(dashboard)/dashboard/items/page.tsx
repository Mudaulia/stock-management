"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useToast, Toaster } from "@/components/ui/toaster";
import {
  useItems,
  useCreateItem,
  useUpdateItem,
  useDeleteItem,
  useBulkDeleteItems,
  useExportItems,
} from "@/hooks/use-api";
import { useAuth } from "@/hooks/use-auth";
import { itemSchema } from "@/lib/schemas";
import { SkeletonTable } from "@/components/ui/skeleton";
import {
  useKeyboardNavigation,
  useRowSelection,
  useUnsavedChangesWarning,
  useFormDirtyTracking,
  useDebounce,
} from "@/hooks";
import { EmptyState, NoData } from "@/components/ui/empty-state";
import { ItemsFilter } from "./components/items-filter";
import { ItemsTable } from "./components/items-table";
import { ItemFormDialog } from "./components/item-form-dialog";
import { DeleteConfirmDialog } from "./components/delete-confirm-dialog";
import type { Item, ItemForm } from "./components/types";

export default function ItemsPage() {
  const { showSuccess, showError } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [search, setSearch] = useState("");
  // Debounce agar tidak fetch API per keystroke (FEF-01)
  const debouncedSearch = useDebounce(search, 300);
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

  const form = useForm<ItemForm>({
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
  const { register, handleSubmit, reset, formState, setValue, watch } = form;

  // React Query hooks
  const {
    data: itemsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useItems({
    page: pagination.page,
    limit: pagination.limit,
    search: debouncedSearch,
    isActive: isActiveFilter !== "all" ? isActiveFilter === "true" : undefined,
  });

  const createMutation = useCreateItem({
    onSuccess: () => {
      showSuccess("Berhasil ditambahkan");
      setIsDialogOpen(false);
    },
    onError: (err) => showError("Error", err.message),
  });

  const updateMutation = useUpdateItem({
    onSuccess: () => {
      showSuccess("Berhasil diupdate");
      setIsDialogOpen(false);
    },
    onError: (err) => showError("Error", err.message),
  });

  const deleteMutation = useDeleteItem({
    onSuccess: () => {
      showSuccess("Berhasil dihapus");
      setDeleteConfirm(null);
    },
    onError: (err) => showError("Error", err.message),
  });

  const bulkDeleteMutation = useBulkDeleteItems({
    onSuccess: () => {
      showSuccess("Berhasil menghapus item terpilih");
      clearSelection();
    },
    onError: (err) => showError("Error", err.message),
  });

  const exportMutation = useExportItems({
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `items-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showSuccess("Berhasil mengekspor data");
    },
    onError: (err) => showError("Error", err.message),
  });

  const items = itemsData?.data ?? [];
  const paginationData = itemsData?.pagination;

  // Keyboard navigation
  const { tableRef } = useKeyboardNavigation<Item>({
    rowCount: items.length,
    enabled: !isLoading && items.length > 0,
  });

  // Row selection for bulk actions
  const {
    selectedIds,
    selectedCount,
    toggleRow,
    toggleAll,
    clearSelection,
    isSelected,
  } = useRowSelection<Item>();

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

  const handleDelete = () => {
    if (deleteConfirm) {
      deleteMutation.mutate(deleteConfirm);
    }
  };

  const handleBulkDelete = () => {
    if (selectedCount === 0) return;
    if (confirm(`Yakin ingin menghapus ${selectedCount} item terpilih?`)) {
      bulkDeleteMutation.mutate(Array.from(selectedIds));
    }
  };

  const handleExport = () => {
    exportMutation.mutate({
      ids: Array.from(selectedIds),
      params: {
        search,
        isActive:
          isActiveFilter !== "all" ? isActiveFilter === "true" : undefined,
      },
    });
  };

  // Track form dirty state for unsaved changes warning
  const formValues = watch();
  const initialFormValues = {
    code: "",
    name: "",
    unit: "PCS",
    minStock: 0,
    currentStock: 0,
    description: "",
  };
  // Only track the form fields we care about
  const trackedFormValues = {
    code: formValues.code ?? "",
    name: formValues.name ?? "",
    unit: formValues.unit ?? "PCS",
    minStock: formValues.minStock ?? 0,
    currentStock: formValues.currentStock ?? 0,
    description: formValues.description ?? "",
  };
  const isFormDirty = useFormDirtyTracking(
    initialFormValues,
    trackedFormValues,
  );

  // Unsaved changes warning for dialog
  const { confirmLeave } = useUnsavedChangesWarning({
    isDirty: isFormDirty && isDialogOpen,
    message:
      "Anda memiliki perubahan yang belum disimpan. Yakin ingin menutup dialog ini?",
  });

  const handleDialogClose = async () => {
    const confirmed = await confirmLeave();
    if (confirmed) {
      setIsDialogOpen(false);
    }
  };

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
          <h1 className="text-3xl font-bold text-foreground">Data Barang</h1>
          <p className="text-muted-foreground mt-1">
            Kelola master data sparepart
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Barang
        </Button>
      </div>

      {/* Search & Filter */}
      <ItemsFilter
        search={search}
        onSearchChange={setSearch}
        isActiveFilter={isActiveFilter}
        onIsActiveFilterChange={setIsActiveFilter}
        onSubmit={handleSearch}
      />

      {/* Table */}
      <Card>
        <CardContent className="pt-0">
          {isLoading ? (
            <SkeletonTable rows={5} columns={9} />
          ) : isError ? (
            <EmptyState
              title="Gagal memuat data"
              description={
                error?.message ??
                "Terjadi kesalahan saat memuat data barang. Silakan coba lagi."
              }
              actionLabel="Coba Lagi"
              onAction={() => refetch()}
            />
          ) : items.length === 0 ? (
            <NoData
              title="Belum ada data barang"
              description="Mulai dengan menambahkan barang pertama Anda."
              actionLabel="Tambah Barang Pertama"
              onAction={openCreateDialog}
            />
          ) : (
            <ItemsTable
              tableRef={tableRef}
              items={items}
              selectedCount={selectedCount}
              isSelected={isSelected}
              toggleRow={toggleRow}
              toggleAll={toggleAll}
              clearSelection={clearSelection}
              pagination={pagination}
              paginationData={paginationData}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
              isAdmin={isAdmin}
              isBulkDeletePending={bulkDeleteMutation.isPending}
              isExportPending={exportMutation.isPending}
              onBulkDelete={handleBulkDelete}
              onExport={handleExport}
              onEdit={openEditDialog}
              onDelete={setDeleteConfirm}
              getStockStatus={getStockStatus}
            />
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <ItemFormDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        onCancel={() => setIsDialogOpen(false)}
        editingItem={editingItem}
        form={form}
        onSubmit={onSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(open: boolean) => !open && setDeleteConfirm(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
