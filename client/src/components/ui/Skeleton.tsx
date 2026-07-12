export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="animate-pulse">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 px-4 py-3 border-b border-appborder last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-4 bg-appbg rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="h-3 w-24 bg-appbg rounded mb-3" />
      <div className="h-8 w-16 bg-appbg rounded" />
    </div>
  );
}

export function ChartSkeleton({ height = 260 }: { height?: number }) {
  return <div className="animate-pulse bg-appbg rounded-card" style={{ height }} />;
}
