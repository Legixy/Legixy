'use client';

/**
 * Loading placeholders sized to match the real content they replace, so the
 * layout does not jump when data arrives.
 */

function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded ${className}`}
      style={{ background: 'var(--secondary)' }}
    />
  );
}

export function SiteCardSkeleton() {
  return (
    <div
      className="rounded-xl border bg-[var(--surface)] p-5"
      style={{ borderColor: 'var(--border)', boxShadow: 'var(--shadow-xs)' }}
    >
      <Shimmer className="h-4 w-40" />
      <Shimmer className="mt-2 h-3 w-24" />
      <div className="mt-5 flex items-center gap-3">
        <Shimmer className="h-3 w-20" />
        <Shimmer className="h-5 w-24 rounded-full" />
      </div>
    </div>
  );
}

export function LicenseRowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 px-4 py-4">
          <div className="min-w-0 flex-1">
            <Shimmer className="h-4 w-48" />
            <Shimmer className="mt-2 h-3 w-32" />
          </div>
          <Shimmer className="hidden h-3 w-24 sm:block" />
          <Shimmer className="h-5 w-24 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Shimmer className="h-7 w-64" />
      <Shimmer className="h-32 w-full rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Shimmer className="h-20 w-full rounded-xl" />
        <Shimmer className="h-20 w-full rounded-xl" />
      </div>
    </div>
  );
}
