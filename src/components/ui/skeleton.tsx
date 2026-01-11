import { cn } from "@/lib/utils"

/* ============================================
   SKELETON COMPONENT
   Premium loading skeleton with shimmer effect
   ============================================ */

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-muted/60",
        "after:absolute after:inset-0",
        "after:bg-gradient-to-r after:from-transparent after:via-white/5 after:to-transparent",
        "after:translate-x-[-200%] after:animate-[shimmer_2s_infinite]",
        className
      )}
      {...props}
    />
  )
}

function ListingCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/50 overflow-hidden bg-card">
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-5 w-3/4 rounded-md" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-4 w-24 rounded-md" />
        </div>
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-7 w-20 rounded-md" />
          <Skeleton className="h-4 w-12 rounded-md" />
        </div>
      </div>
    </div>
  )
}

function ChatMessageSkeleton({ isOwn = false }: { isOwn?: boolean }) {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className={cn(
        "max-w-[70%] rounded-2xl p-4 space-y-2",
        isOwn ? "bg-primary/10" : "bg-muted/50"
      )}>
        <Skeleton className="h-4 w-40 rounded-md" />
        <Skeleton className="h-4 w-24 rounded-md" />
        <Skeleton className="h-3 w-16 rounded-md" />
      </div>
    </div>
  )
}

function EventCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/50 overflow-hidden bg-card">
      <Skeleton className="h-40 w-full" />
      <div className="p-5 space-y-4">
        <Skeleton className="h-6 w-3/4 rounded-md" />
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-32 rounded-md" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-24 rounded-md" />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-40 rounded-md" />
          <Skeleton className="h-4 w-24 rounded-md" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
    </div>
  )
}

function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-border/50">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1 rounded-md" />
      ))}
    </div>
  )
}

export { 
  Skeleton, 
  ListingCardSkeleton, 
  ChatMessageSkeleton, 
  EventCardSkeleton,
  ProfileSkeleton,
  TableRowSkeleton
}
