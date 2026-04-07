export default function SkeletonCard() {
  return (
    <div className="flex gap-3 px-4 py-3 border-b border-zinc-100 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-zinc-200 flex-shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="flex gap-2">
          <div className="h-4 w-24 bg-zinc-200 rounded" />
          <div className="h-4 w-16 bg-zinc-200 rounded" />
        </div>
        <div className="h-4 w-full bg-zinc-200 rounded" />
        <div className="h-4 w-3/4 bg-zinc-200 rounded" />
      </div>
    </div>
  );
}

export function SkeletonFeed({ count = 5 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
