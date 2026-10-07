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
import { Search, Loader2, Package, Filter, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast, Toaster } from "@/components/ui/toaster";
import { format } from "date-fns";
import { bem, bemVariant } from "@/lib/bem";
import { useMutationReport, useExportMutationReport } from "@/hooks/use-api";
import { mutationReportItemSchema, mutationSummarySchema } from "@/lib/schemas";
import { SkeletonTable } from "@/components/ui/skeleton";
import { useKeyboardNavigation, useRowSelection } from "@/hooks/use-keyboard-navigation";
import { Download } from "lucide-react";
import { EmptyState, NoData } from "@/components/ui/empty-state";

type MutationTransaction = z.infer<typeof mutationReportItemSchema>;
type MutationSummary = z.infer<typeof mutationSummarySchema>;

export default function MutationReportPage() {
  const { showSuccess, showError } = useToast();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [itemId, setItemId] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  // React Query hooks
  const { data: reportData, isLoading, refetch } = useMutationReport({
    page: pagination.page,
    limit: pagination.limit,
    search,
    type: typeFilter || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    itemId: itemId || undefined,
  });

  const transactions = reportData?.data ?? [];
  const summary = reportData?.summary ?? {};
  const paginationData = reportData?.pagination;

  // Keyboard navigation
  const { tableRef, selectedIndex, setSelectedIndex } = useKeyboardNavigation<MutationTransaction>({
    rowCount: transactions.length,
    enabled: !isLoading && transactions.length > 0,
  });

  // Row selection for bulk actions
  const { selectedIds, selectedCount, toggleRow, toggleAll, clearSelection, isSelected } = useRowSelection<MutationTransaction>()

  // Export mutation
  const exportMutation = useExportMutationReport({
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mutation-report-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      showSuccess('Berhasil', 'Laporan mutasi berhasil diekspor')
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

  const getTypeBadge = (type: string) => {
    const variants = {
      STOCK_IN: "bg-green-100 text-green-800",
      STOCK_OUT: "bg-red-100 text-red-800",
      ADJUSTMENT: "bg-yellow-100 text-yellow-800",
    };
    const labels = {
      STOCK_IN: "Masuk",
      STOCK_OUT: "Keluar",
      ADJUSTMENT: "Penyesuaian",
    };
    return (
      <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", variants[type as keyof typeof variants])}>
        {labels[type as keyof typeof labels]}
      </span>
    );
  };

  const getQuantityDisplay = (type: string, quantity: number) => {
    if (type === "STOCK_IN") return `+${quantity}`;
    if (type === "STOCK_OUT") return `-${quantity}`;
    return quantity > 0 ? `+${quantity}` : `${quantity}`;
  };

  const getQuantityColor = (type: string) => {
    if (type === "STOCK_IN") return "text-green-600";
    if (type === "STOCK_OUT") return "text-red-600";
    return "text-yellow-600";
  };

  return (
    <div className="space-y-6">
      <Toaster />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Laporan Mutasi Stok</h1>
          <p className="text-gray-500 mt-1">Riwayat pergerakan stok barang (masuk, keluar, penyesuaian)</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg"><Package className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-sm text-gray-500">Total Transaksi</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Object.values(summary).reduce((acc, curr) => acc + curr.transactionCount, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg"><Package className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="text-sm text-gray-500">Total Stok Masuk</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.STOCK_IN?.totalQuantity || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg"><Package className="h-5 w-5 text-red-600" /></div>
              <div>
                <p className="text-sm text-gray-500">Total Stok Keluar</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.STOCK_OUT?.totalQuantity || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg"><Filter className="h-5 w-5 text-yellow-600" /></div>
              <div>
                <p className="text-sm text-gray-500">Total Penyesuaian</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.ADJUSTMENT?.totalQuantity || 0}
                </p>
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
                placeholder="Kode, nama, referensi, catatan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="w-[180px]">
              <Label className="block text-sm font-medium text-gray-700 mb-1">Tipe</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua tipe</SelectItem>
                  <SelectItem value="STOCK_IN">Stok Masuk</SelectItem>
                  <SelectItem value="STOCK_OUT">Stok Keluar</SelectItem>
                  <SelectItem value="ADJUSTMENT">Penyesuaian</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-[180px]">
              <Label className="block text-sm font-medium text-gray-700 mb-1">Dari Tanggal</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="w-[180px]">
              <Label className="block text-sm font-medium text-gray-700 mb-1">Sampai Tanggal</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-0">
          {isLoading ? (
            <SkeletonTable rows={5} columns={7} />
          ) : transactions.length === 0 ? (
            <NoData
              title="Tidak ada data mutasi stok"
              description="Belum ada transaksi stok yang tercatat."
              actionLabel="Lihat Stok Masuk"
              onAction={() => window.location.href = '/dashboard/stock-in'}
            />
          ) : (
            <>
              {/* Bulk Actions Bar */}
              {selectedCount > 0 && (
                <div className="mb-4 flex items-center justify-between p-4 bg-muted rounded-lg">
                  <span className="text-sm font-medium">
                    {selectedCount} transaksi terpilih
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
                          checked={selectedCount === transactions.length && transactions.length > 0}
                          onChange={() => toggleAll(transactions.map(t => t.id))}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          aria-label="Pilih semua"
                        />
                      </TableHead>
                      <TableHead>Barang</TableHead>
                      <TableHead className="w-32">Tipe</TableHead>
                      <TableHead className="text-right w-32">Jumlah</TableHead>
                      <TableHead>Referensi</TableHead>
                      <TableHead>Catatan</TableHead>
                      <TableHead className="w-40">Tanggal</TableHead>
                      <TableHead>Dibuat Oleh</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx, index) => {
                      const globalIndex = (pagination.page - 1) * pagination.limit + index + 1;
                      const rowSelected = isSelected(tx.id)
                      return (
                        <TableRow key={tx.id} className={cn(rowSelected && "bg-primary/5")} onClick={() => toggleRow(tx.id)}>
                          <TableCell className="w-12">
                            <input
                              type="checkbox"
                              checked={rowSelected}
                              onChange={(e) => { e.stopPropagation(); toggleRow(tx.id); }}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              aria-label={`Pilih transaksi ${tx.id}`}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{tx.item.name}</div>
                            <div className="text-sm text-muted-foreground font-mono">{tx.item.code}</div>
                          </TableCell>
                          <TableCell>{getTypeBadge(tx.type)}</TableCell>
                          <TableCell className={cn("text-right font-mono", getQuantityColor(tx.type))}>
                            {getQuantityDisplay(tx.type, tx.quantity)} {tx.item.unit}
                          </TableCell>
                          <TableCell>{tx.reference || "-"}</TableCell>
                          <TableCell>{tx.notes || "-"}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(tx.transactionDate), "dd MMM yyyy HH:mm")}
                          </TableCell>
                          <TableCell>{tx.createdBy.fullName}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={7} className="py-4">
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