/**
 * /src/shared/components/SkeletonLoader.tsx
 *
 * Skeleton loaders for various UI elements
 * Provides smooth loading experience
 */

'use client';

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
      <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
      <div className="h-3 bg-slate-200 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-slate-200 rounded w-2/3"></div>
    </div>
  );
}

export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 bg-slate-200 rounded skeleton"
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        ></div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="h-64 bg-slate-100 rounded-lg animate-pulse flex items-end gap-2 p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex-1 bg-slate-200 rounded"
          style={{ height: `${Math.random() * 100 + 20}%` }}
        ></div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="h-10 bg-slate-200 rounded skeleton flex-1"></div>
          <div className="h-10 bg-slate-200 rounded skeleton flex-1"></div>
          <div className="h-10 bg-slate-200 rounded skeleton w-24"></div>
        </div>
      ))}
    </div>
  );
}

export function GridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="h-8 bg-slate-200 rounded skeleton w-1/3 mb-2"></div>
        <div className="h-4 bg-slate-200 rounded skeleton w-1/2"></div>
      </div>

      {/* Grid */}
      <GridSkeleton count={4} />

      {/* Content */}
      <div className="space-y-3">
        <TextSkeleton lines={4} />
      </div>
    </div>
  );
}
