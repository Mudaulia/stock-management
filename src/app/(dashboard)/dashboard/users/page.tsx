"use client";

import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Edit,
  Loader2,
  MoreHorizontal,
  Users as UsersIcon,
  UserCheck,
  UserX,
} from "lucide-react";
import { useToast, Toaster } from "@/components/ui/toaster";
import { useUsers, useCreateUser, useUpdateUser } from "@/hooks/use-api";
import { useAuth } from "@/hooks/use-auth";
import { SkeletonTable } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks";
import { EmptyState, NoData } from "@/components/ui/empty-state";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ROLES = ["ADMIN", "WAREHOUSE_STAFF", "VIEWER"] as const;
type Role = (typeof ROLES)[number];

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admin",
  WAREHOUSE_STAFF: "Staf Gudang",
  VIEWER: "Viewer",
};

// Form schema: password opsional saat edit, wajib diisi manual saat create
const userFormSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .max(50)
    .regex(
      /^[a-zA-Z0-9_.-]+$/,
      "Hanya huruf, angka, titik, garis bawah, strip",
    ),
  fullName: z.string().min(1, "Nama lengkap wajib diisi"),
  role: z.enum(ROLES),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .regex(/[a-zA-Z]/, "Password harus mengandung huruf")
    .regex(/[0-9]/, "Password harus mengandung angka")
    .optional()
    .or(z.literal("")),
});

type UserForm = z.infer<typeof userFormSchema>;

export default function UsersPage() {
  const { showSuccess, showError } = useToast();
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<{
    id: string;
    email: string;
    username: string;
    fullName: string;
    role: Role;
    isActive: boolean;
  } | null>(null);
  const [toggleConfirm, setToggleConfirm] = useState<{
    id: string;
    name: string;
    activate: boolean;
  } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch,
  } = useForm<UserForm>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: "",
      username: "",
      fullName: "",
      role: "VIEWER",
      password: "",
    },
  });

  const watchedRole = watch("role");

  const {
    data: usersData,
    isLoading,
    isError,
    error,
    refetch,
  } = useUsers({
    page: pagination.page,
    limit: pagination.limit,
    search: debouncedSearch,
    role: roleFilter !== "all" ? roleFilter : undefined,
  });

  const users = usersData?.data ?? [];
  const paginationInfo = usersData?.pagination;

  const createMutation = useCreateUser({
    onSuccess: () => {
      showSuccess("Pengguna berhasil ditambahkan");
      closeDialog();
    },
    onError: (err) => showError("Error", err.message),
  });

  const updateMutation = useUpdateUser({
    onSuccess: () => {
      showSuccess("Pengguna berhasil diperbarui");
      closeDialog();
    },
    onError: (err) => showError("Error", err.message),
  });

  function openCreateDialog() {
    setEditingUser(null);
    reset({
      email: "",
      username: "",
      fullName: "",
      role: "VIEWER",
      password: "",
    });
    setIsDialogOpen(true);
  }

  function openEditDialog(user: (typeof users)[number]) {
    setEditingUser(user);
    reset({
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      password: "",
    });
    setIsDialogOpen(true);
  }

  function closeDialog() {
    setIsDialogOpen(false);
    setEditingUser(null);
  }

  const onSubmit = async (data: UserForm) => {
    if (editingUser) {
      const payload: Record<string, unknown> = {
        email: data.email,
        username: data.username,
        fullName: data.fullName,
        role: data.role,
      };
      if (data.password) {
        payload.password = data.password;
      }
      await updateMutation.mutateAsync({ id: editingUser.id, data: payload });
    } else {
      await createMutation.mutateAsync({
        email: data.email,
        username: data.username,
        fullName: data.fullName,
        role: data.role,
        password: data.password,
      });
    }
  };

  const toggleMutation = useUpdateUser({
    onSuccess: () => {
      showSuccess(
        toggleConfirm?.activate
          ? "Pengguna berhasil diaktifkan"
          : "Pengguna berhasil dinonaktifkan",
      );
      setToggleConfirm(null);
    },
    onError: (err) => {
      showError("Error", err.message);
      setToggleConfirm(null);
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <Toaster />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Manajemen Pengguna
          </h1>
          <p className="text-muted-foreground">
            Kelola akun pengguna dan hak akses (khusus Admin)
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Pengguna
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Cari nama, email, username..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={roleFilter}
              onValueChange={(v) => {
                setRoleFilter(v as "all" | Role);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Semua Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Role</SelectItem>
                {ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <SkeletonTable rows={5} columns={6} />
          ) : isError ? (
            <EmptyState
              title="Gagal memuat data"
              description={
                error?.message ??
                "Terjadi kesalahan saat memuat pengguna. Silakan coba lagi."
              }
              actionLabel="Coba Lagi"
              onAction={() => refetch()}
            />
          ) : users.length === 0 ? (
            <NoData
              title={
                debouncedSearch || roleFilter !== "all"
                  ? "Tidak ada hasil"
                  : "Belum ada pengguna"
              }
              description={
                debouncedSearch || roleFilter !== "all"
                  ? "Coba ubah kata kunci atau filter."
                  : "Tambahkan pengguna pertama untuk memulai."
              }
              icon={<UsersIcon className="h-8 w-8" />}
            />
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Login Terakhir</TableHead>
                      <TableHead className="w-[70px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.fullName}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell className="text-muted-foreground">
                          @{user.username}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.role === "ADMIN"
                                ? "default"
                                : user.role === "WAREHOUSE_STAFF"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {ROLE_LABELS[user.role]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.isActive ? (
                            <Badge
                              variant="outline"
                              className="text-green-600 border-green-300"
                            >
                              <UserCheck className="mr-1 h-3 w-3" /> Aktif
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-destructive border-destructive/40"
                            >
                              <UserX className="mr-1 h-3 w-3" /> Nonaktif
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.lastLoginAt
                            ? formatDate(user.lastLoginAt)
                            : "Belum pernah"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => openEditDialog(user)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              {currentUser?.id !== user.id && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    setToggleConfirm({
                                      id: user.id,
                                      name: user.fullName,
                                      activate: !user.isActive,
                                    })
                                  }
                                >
                                  {user.isActive ? (
                                    <>
                                      <UserX className="mr-2 h-4 w-4" />
                                      Nonaktifkan
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="mr-2 h-4 w-4" />
                                      Aktifkan
                                    </>
                                  )}
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Total {paginationInfo?.total ?? 0} pengguna
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page - 1,
                      }))
                    }
                  >
                    Sebelumnya
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Hal. {pagination.page} / {paginationInfo?.totalPages ?? 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      pagination.page >= (paginationInfo?.totalPages ?? 1)
                    }
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page + 1,
                      }))
                    }
                  >
                    Berikutnya
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Edit Pengguna" : "Tambah Pengguna"}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Perbarui data pengguna. Biarkan password kosong jika tidak diubah."
                : "Buat akun pengguna baru beserta role-nya."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nama Lengkap *</Label>
              <Input
                id="fullName"
                placeholder="Budi Santoso"
                {...register("fullName")}
              />
              {errors.fullName && (
                <p className="text-sm text-destructive">
                  {errors.fullName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="budi@perusahaan.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                placeholder="budi.santoso"
                {...register("username")}
              />
              {errors.username && (
                <p className="text-sm text-destructive">
                  {errors.username.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Role *</Label>
              <Select
                value={watchedRole}
                onValueChange={(v) => setValue("role", v as Role)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                Password {!editingUser && "*"}{" "}
                {editingUser && "(kosongkan jika tidak diubah)"}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={
                  editingUser ? "••••••••" : "Min. 8 karakter, huruf & angka"
                }
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingUser ? "Simpan" : "Tambah"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Toggle Active Confirm Dialog */}
      <Dialog
        open={!!toggleConfirm}
        onOpenChange={(open) => !open && setToggleConfirm(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {toggleConfirm?.activate
                ? "Aktifkan pengguna?"
                : "Nonaktifkan pengguna?"}
            </DialogTitle>
            <DialogDescription>
              {toggleConfirm?.activate
                ? `${toggleConfirm.name} akan dapat login kembali.`
                : `${toggleConfirm?.name} tidak akan bisa login. Riwayat transaksinya tetap tersimpan.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToggleConfirm(null)}>
              Batal
            </Button>
            <Button
              variant={toggleConfirm?.activate ? "default" : "destructive"}
              disabled={toggleMutation.isPending}
              onClick={() => {
                if (toggleConfirm) {
                  toggleMutation.mutate({
                    id: toggleConfirm.id,
                    data: { isActive: toggleConfirm.activate },
                  });
                }
              }}
            >
              {toggleMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {toggleConfirm?.activate ? "Aktifkan" : "Nonaktifkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
