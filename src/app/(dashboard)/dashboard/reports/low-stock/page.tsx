"use client";

import { useState, useCallback } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Loader2, AlertTriangle, Package, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast, Toaster } from "@/components/ui/toaster";
import { bem, bemVariant } from "@/lib/bem";
import { useLowStockReport, useExportLowStockReport } from "@/hooks/use-api";
import { lowStockReportItemSchema, lowStockReportSummarySchema } from "@/lib/schemas";
import { SkeletonTable } from "@/components/ui/skeleton";
import { useKeyboardNavigation, useRowSelection } from "@/hooks/use-keyboard-navigation";
import { Download } from "lucide-react";
import { EmptyState, NoData } from "@/components/ui/empty-state";

type LowStockItem = z.infer<typeof lowStockReportItemSchema>;
type LowStockReportSummary = z.infer<typeof lowStockReportSummarySchema>;

export default function LowStockReportPage() {
  const { showSuccess, showError } = useToast();
  const [search, setSearch] = useState("");
  const [includeZeroStock, setIncludeZeroStock] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  // React Query hooks
  const { data: reportData, isLoading, refetch } = useLowStockReport({
    page: pagination.page,
    limit: pagination.limit,
    search,
    includeZeroStock,
  });

  const items = reportData?.data ?? [];
  const summary = reportData?.summary ?? { totalLowStock: 0, totalOutOfStock: 0, totalItems: 0 };
  const paginationData = reportData?.pagination;

  // Keyboard navigation
  const { tableRef, selectedIndex, setSelectedIndex } = useKeyboardNavigation<LowStockItem>({
    rowCount: items.length,
    enabled: !isLoading && items.length > 0,
  });

  // Row selection for bulk actions
  const { selectedIds, selectedCount, toggleRow, toggleAll, clearSelection, isSelected } = useRowSelection<LowStockItem>()

  // Export mutation
  const exportMutation = useExportLowStockReport({
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `low-stock-report-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      showSuccess('Berhasil', 'Laporan stok minimum berhasil diekspor')
    },
    onError: (err) => showError('Error', err.message),
  })

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

  const getStatusBadge = (status: string) => {
    const variants = {
      OUT_OF_STOCK: "bg-red-100 text-red-800",
      LOW_STOCK: "bg-yellow-100 text-yellow-800",
    };
    const labels = {
      OUT_OF_STOCK: "Habis",
      LOW_STOCK: "Rendah",
    };
    return (
      <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", variants[status as keyof typeof variants])}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getStockPercentageColor = (percentage: number) => {
    if (percentage <= 0) return "text-red-600";
    if (percentage <= 50) return "text-orange-600";
    return "text-green-600";
  };

  return (
    <div className="space-y-6">
      <Toaster />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Laporan Stok Minimum</h1>
          <p className="text-gray-500 mt-1">Barang dengan stok di bawah atau sama dengan batas minimum</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg"><AlertTriangle className="h-5 w-5 text-yellow-600" /></div>
              <div>
                <p className="text-sm text-gray-500">Stok Rendah</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalLowStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg"><Package className="h-5 w-5 text-red-600" /></div>
              <div>
                <p className="text-sm text-gray-500">Stok Habis</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalOutOfStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg"><Filter className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-sm text-gray-500">Total Item</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Cari kode atau nama barang..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeZeroStock}
                  onChange={(e) => setIncludeZeroStock(e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm">Sertakan stok 0</span>
              </label>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-0">
          {isLoading ? (
            <SkeletonTable rows={5} columns={8} />
          ) : items.length === 0 ? (
            <NoData
              title="Tidak ada data stok minimum"
              description="Semua barang memiliki stok di atas batas minimum."
              actionLabel="Lihat Semua Barang"
              onAction={() => window.location.href = '/dashboard/items'}
            />
          ) : (
            <>
              {/* Bulk Actions Bar */}
              {selectedCount > 0 && (
                <div className="mb-4 flex items-center justify-between p-4 bg-muted rounded-lg">
                  <span className="text-sm font-medium">
                    {selectedCount} item terpilih
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportMutation.mutate({ ids: Array.from(selectedIds) })}
                      disabled={exportMutation.isPending}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Ekspor CSV
                    </Button>
                    <Button variant="ghost" size="sm" onClick={clearSelection}>
                      Batal
                    </Button>
                  </div>
                </div>
              )}
              <div className="overflow-x-auto" ref={tableRef} tabIndex={0}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={selectedCount === items.length && items.length > 0}
                          onChange={() => toggleAll(items.map(i => i.id))}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          aria-label="Pilih semua"
                        />
                      </TableHead>
                      <TableHead className="w-24">Kode</TableHead>
                      <TableHead>Nama Barang</TableHead>
                      <TableHead className="w-24">Satuan</TableHead>
                      <TableHead className="text-right w-32">Stok Saat Ini</TableHead>
                      <TableHead className="text-right w-32">Stok Minimum</TableHead>
                      <TableHead className="text-right w-32">Kekurangan</TableHead>
                      <TableHead className="text-right w-32">% dari Min</TableHead>
                      <TableHead className="w-32">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => {
                      const globalIndex = (pagination.page - 1) * pagination.limit + index + 1;
                      const rowSelected = isSelected(item.id)
                      return (
                        <TableRow key={item.id} className={cn(rowSelected && "bg-primary/5")} onClick={() => toggleRow(item.id)}>
                          <TableCell className="w-12">
                            <input
                              type="checkbox"
                              checked={rowSelected}
                              onChange={(e) => { e.stopPropagation(); toggleRow(item.id); }}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              aria-label={`Pilih item ${item.id}`}
                            />
                          </TableCell>
                          <TableCell className="font-mono text-sm">{item.code}</TableCell>
                          <TableCell>
                            <div className="font-medium">{item.name}</div>
                          </TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell className="text-right font-mono font-medium">
                            {item.currentStock.toLocaleString("id-ID")}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {item.minStock.toLocaleString("id-ID")}
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium text-red-600">
                            {item.shortage.toLocaleString("id-ID")}
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium">
                            <span className={getStockPercentageColor(item.stockPercentage)}>
                              {item.stockPercentage}%
                            </span>
                          </TableCell>
                          <TableCell>{getStatusBadge(item.stockStatus)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={8} className="py-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="text-sm text-muted-foreground">
                            Menampilkan{" "}
                            {((pagination.page - 1) * pagination.limit) + 1}{" "}
                            -{" "}
                            {Math.min(pagination.page * pagination.limit, paginationData?.total ?? 0)}{" "}
                            dari{" "}
                            {paginationData?.total ?? 0}{" "}
                            data
                          </div>
                          <div className="flex items-center gap-2">
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
                              disabled={pagination.page <= 1}
                            >
                              Sebelumnya
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange(pagination.page + 1)}
                              disabled={pagination.page >= (paginationData?.totalPages ?? 1)}
                            >
                              Selanjutnya
                            </Button>
                            <span className="flex items-center px-2 text-sm text-muted-foreground">
                              Halaman {pagination.page} dari {paginationData?.totalPages ?? 1}
                            </span>
                          </div>
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
    </div>
  );
}