"use client";

import { Button } from "@/components/ui/button";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, Trash2, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Item } from "./types";

interface ItemsTableProps {
  tableRef: React.RefObject<HTMLDivElement>;
  items: Item[];
  selectedCount: number;
  isSelected: (id: string) => boolean;
  toggleRow: (id: string) => void;
  toggleAll: (ids: string[]) => void;
  clearSelection: () => void;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  paginationData?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  isAdmin: boolean;
  isBulkDeletePending: boolean;
  isExportPending: boolean;
  onBulkDelete: () => void;
  onExport: () => void;
  onEdit: (item: Item) => void;
  onDelete: (id: string) => void;
  getStockStatus: (
    item: Item,
  ) => { label: string; className: string };
}

export function ItemsTable({
  tableRef,
  items,
  selectedCount,
  isSelected,
  toggleRow,
  toggleAll,
  clearSelection,
  pagination,
  paginationData,
  onPageChange,
  onLimitChange,
  isAdmin,
  isBulkDeletePending,
  isExportPending,
  onBulkDelete,
  onExport,
  onEdit,
  onDelete,
  getStockStatus,
}: ItemsTableProps) {
  return (
    <>
      {/* Bulk Actions Bar */}
      {selectedCount > 0 && (
        <div className="mb-4 flex items-center justify-between p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedCount} item terpilih
          </span>
          <div className="flex gap-2">
            {isAdmin && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onBulkDelete}
                disabled={isBulkDeletePending}
              >
                {isBulkDeletePending ? "Menghapus..." : "Hapus Terpilih"}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              disabled={isExportPending}
            >
              {isExportPending ? "Mengekspor..." : "Ekspor CSV"}
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
                  onChange={() => toggleAll(items.map((i) => i.id))}
                  className="h-4 w-4 rounded border text-primary focus:ring-primary"
                  aria-label="Pilih semua"
                />
              </TableHead>
              <TableHead className="items__table-cell items__table-cell--index">
                #{" "}
              </TableHead>
              <TableHead className="items__table-cell items__table-cell--code">
                Kode
              </TableHead>
              <TableHead className="items__table-cell items__table-cell--name">
                Nama Barang
              </TableHead>
              <TableHead className="items__table-cell items__table-cell--unit">
                Satuan
              </TableHead>
              <TableHead className="items__table-cell items__table-cell--stock items__table-cell--number">
                Stok
              </TableHead>
              <TableHead className="items__table-cell items__table-cell--min items__table-cell--number">
                Min
              </TableHead>
              <TableHead className="items__table-cell items__table-cell--status">
                Status
              </TableHead>
              <TableHead className="items__table-cell items__table-cell--actions">
                Aksi
              </TableHead>
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
                    if (
                      !(e.target as HTMLElement).closest(
                        '[role="menu"], button, input, a',
                      )
                    ) {
                      toggleRow(item.id);
                    }
                  }}
                >
                  <TableCell className="items__table-cell items__table-cell--select">
                    <input
                      type="checkbox"
                      checked={rowSelected}
                      onChange={() => toggleRow(item.id)}
                      className="h-4 w-4 rounded border text-primary focus:ring-primary"
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
                  <TableCell className="items__table-cell items__table-cell--unit">
                    {item.unit}
                  </TableCell>
                  <TableCell className="items__table-cell items__table-cell--stock items__table-cell--number items__table-cell--stock-mono">
                    {item.currentStock.toLocaleString()}
                  </TableCell>
                  <TableCell className="items__table-cell items__table-cell--min items__table-cell--number items__table-cell--min-mono">
                    {item.minStock.toLocaleString()}
                  </TableCell>
                  <TableCell className="items__table-cell items__table-cell--status">
                    <span className={cn("items__badge", status.className)}>
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
                            onEdit(item);
                          }}
                        >
                          <Edit className="items__dropdown-icon" />
                          Edit
                        </DropdownMenuItem>
                        {isAdmin && item.isActive && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(item.id);
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
                <div className="text-sm text-muted-foreground">
                  Menampilkan {(pagination.page - 1) * pagination.limit + 1} -{" "}
                  {Math.min(
                    pagination.page * pagination.limit,
                    paginationData?.total ?? pagination.total,
                  )}{" "}
                  dari {paginationData?.total ?? pagination.total}
                </div>
                <div className="flex items-center space-x-2">
                  <Select
                    value={pagination.limit.toString()}
                    onValueChange={(v) => onLimitChange(parseInt(v))}
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
                    onClick={() => onPageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    Sebelumnya
                  </Button>
                  <span className="items__page-indicator">
                    Halaman {pagination.page} dari{" "}
                    {paginationData?.totalPages ?? pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(pagination.page + 1)}
                    disabled={
                      pagination.page >=
                      (paginationData?.totalPages ?? pagination.totalPages)
                    }
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
  );
}
