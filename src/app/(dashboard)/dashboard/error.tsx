"use client";

import { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log ke console; frontend tidak melakukan logging terpusat saat ini.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-8">
      <Alert variant="destructive" className="max-w-md">
        <AlertTitle>Terjadi kesalahan</AlertTitle>
        <AlertDescription>
          Gagal memuat data. Silakan coba lagi atau muat ulang halaman.
        </AlertDescription>
      </Alert>
      <Button onClick={reset} variant="outline">
        <RefreshCw className="mr-2 h-4 w-4" />
        Coba lagi
      </Button>
    </div>
  );
}
