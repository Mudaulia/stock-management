export default function DashboardLoading() {
  return (
    <div className="space-y-4 p-8" aria-busy="true" aria-label="Memuat data">
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-lg border bg-muted/50"
          />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-lg border bg-muted/50" />
    </div>
  );
}
