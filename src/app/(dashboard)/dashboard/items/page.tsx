"use client";

import { useState, useEffect } from "react";
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

const itemSchema = z.object({
  code: z.string().min(1, "Kode barang wajib diisi").max(50),
  name: z.string().min(1, "Nama barang wajib diisi").max(255),
  unit: z.string().min(1, "Satuan wajib diisi").max(50),
  minStock: z.coerce.number().int().min(0, "Stok minimum tidak boleh negatif"),
  currentStock: z.coerce
    .number()
    .int()
    .min(0, "Stok saat ini tidak boleh negatif"),
  description: z.string().optional(),
});

type ItemForm = z.infer<typeof itemSchema>;

interface Item {
  id: string;
  code: string;
  name: string;
  unit: string;
  minStock: number;
  currentStock: number;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const UNITS = ["PCS", "SET", "LITER", "UNIT", "METER", "KG", "BOX", "PACK"];

export default function ItemsPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState<
    "all" | "true" | "false"
  >("all");

  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(isActiveFilter !== "all" && {
          isActive: isActiveFilter.toString(),
        }),
      });
      const res = await fetch(`/api/items?${params}`);
      if (!res.ok) throw new Error("Gagal memuat data");
      const json: PaginatedResponse<Item> = await res.json();
      setItems(json.data);
      setPagination(json.pagination);
    } catch (err) {
      showError("Error", "Gagal memuat data barang");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    fetchItems();
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
    setIsSubmitting(true);
    try {
      const url = editingItem ? `/api/items/${editingItem.id}` : "/api/items";
      const method = editingItem ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal menyimpan");
      showSuccess(editingItem ? "Berhasil diupdate" : "Berhasil ditambahkan");
      setIsDialogOpen(false);
      fetchItems();
    } catch (err) {
      showError(
        "Error",
        err instanceof Error ? err.message : "Gagal menyimpan",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal menghapus");
      showSuccess("Berhasil dihapus");
      setDeleteConfirm(null);
      fetchItems();
    } catch (err) {
      showError(
        "Error",
        err instanceof Error ? err.message : "Gagal menghapus",
      );
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
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : items.length === 0 ? (
            <div className="items__empty-state">
              <Package className="items__empty-icon" />
              <p className="items__empty-text">Belum ada data barang</p>
              <Button onClick={openCreateDialog} className="items__empty-button">
                <Plus className="items__empty-button-icon" />
                Tambah Barang Pertama
              </Button>
            </div>
          ) : (
            <>
              <div className="items__table-container">
                <Table>
                  <TableHeader>
                    <TableRow>
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
                      return (
                        <TableRow key={item.id} className="items__table-row">
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
                                  onClick={() => openEditDialog(item)}
                                >
                                  <Edit className="items__dropdown-icon" />
                                  Edit
                                </DropdownMenuItem>
                                {item.isActive && (
                                  <DropdownMenuItem
                                    onClick={() => setDeleteConfirm(item.id)}
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
                        colSpan={8}
                        className="flex items-center justify-between"
                      >
                        <div className="text-sm text-gray-500">
                          Menampilkan{" "}
                          {(pagination.page - 1) * pagination.limit + 1} -{" "}
                          {Math.min(
                            pagination.page * pagination.limit,
                            pagination.total,
                          )}{" "}
                          dari {pagination.total}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setPagination({
                                ...pagination,
                                page: pagination.page - 1,
                              })
                            }
                            disabled={pagination.page === 1}
                          >
                            Sebelumnya
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setPagination({
                                ...pagination,
                                page: pagination.page + 1,
                              })
                            }
                            disabled={pagination.page === pagination.totalPages}
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
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
