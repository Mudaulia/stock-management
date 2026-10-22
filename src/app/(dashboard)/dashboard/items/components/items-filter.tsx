"use client";

import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ItemsFilterProps {
  search: string;
  onSearchChange: (value: string) => void;
  isActiveFilter: "all" | "true" | "false";
  onIsActiveFilterChange: (value: "all" | "true" | "false") => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ItemsFilter({
  search,
  onSearchChange,
  isActiveFilter,
  onIsActiveFilterChange,
  onSubmit,
}: ItemsFilterProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Cari kode atau nama barang..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={isActiveFilter}
            onValueChange={(value: string) =>
              onIsActiveFilterChange(value as "all" | "true" | "false")
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
  );
}
