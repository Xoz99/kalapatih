interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse rounded-xl bg-white/[0.06] ${className}`} />
  )
}

export function TaskCardSkeleton() {
  return (
    <div className="flex items-start gap-4 p-4 md:p-5 rounded-3xl border border-white/[0.04] bg-[#0d0d0d]">
      <div className="w-6 h-6 rounded-full bg-white/[0.06] animate-pulse shrink-0 mt-0.5" />
      <div className="flex-1 space-y-2.5">
        <div className="h-4 w-3/4 rounded-lg bg-white/[0.06] animate-pulse" />
        <div className="flex gap-2">
          <div className="h-5 w-16 rounded-xl bg-white/[0.06] animate-pulse" />
          <div className="h-5 w-20 rounded-xl bg-white/[0.06] animate-pulse" />
        </div>
      </div>
      <div className="w-8 h-8 rounded-2xl bg-white/[0.06] animate-pulse shrink-0" />
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="bg-[#0d0d0d] border border-white/5 rounded-3xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="text-center space-y-1.5">
              <div className="h-8 w-10 mx-auto rounded-lg bg-white/[0.06] animate-pulse" />
              <div className="h-2 w-12 mx-auto rounded bg-white/[0.06] animate-pulse" />
            </div>
          ))}
        </div>
        <div className="text-center space-y-1.5">
          <div className="h-8 w-14 rounded-lg bg-white/[0.06] animate-pulse" />
          <div className="h-2 w-16 rounded bg-white/[0.06] animate-pulse" />
        </div>
      </div>
      <div className="h-2 w-full rounded-full bg-white/[0.06] animate-pulse" />
    </div>
  )
}

export function CalendarItemSkeleton() {
  return (
    <div className="relative bg-black/30 border border-white/5 rounded-2xl p-4 overflow-hidden">
      <div className="absolute left-0 inset-y-0 w-1 bg-white/10 rounded-l-2xl" />
      <div className="pl-3 space-y-2">
        <div className="h-3 w-12 rounded-md bg-white/[0.06] animate-pulse" />
        <div className="h-4 w-full rounded-lg bg-white/[0.06] animate-pulse" />
        <div className="h-3 w-24 rounded-lg bg-white/[0.06] animate-pulse" />
      </div>
    </div>
  )
}
