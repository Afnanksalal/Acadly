import { Suspense } from "react"
import { ListingsContent } from "./listings-content"
import { ListingCardSkeleton } from "@/components/ui/skeleton"

export default function ListingsPage({
  searchParams
}: {
  searchParams: { search?: string; category?: string; type?: string }
}) {
  return (
    <Suspense fallback={<ListingsLoadingState />}>
      <ListingsContent searchParams={searchParams} />
    </Suspense>
  )
}

function ListingsLoadingState() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted/60 rounded-lg animate-pulse" />
          <div className="h-4 w-32 bg-muted/60 rounded-md animate-pulse" />
        </div>
        <div className="h-11 w-36 bg-muted/60 rounded-xl animate-pulse" />
      </div>
      
      {/* Filter skeleton */}
      <div className="flex flex-wrap gap-3">
        <div className="h-10 w-32 bg-muted/60 rounded-lg animate-pulse" />
        <div className="h-10 w-40 bg-muted/60 rounded-lg animate-pulse" />
        <div className="h-10 w-28 bg-muted/60 rounded-lg animate-pulse" />
      </div>
      
      {/* Grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(9)].map((_, i) => (
          <ListingCardSkeleton key={i} />
        ))}
      </div>
    </main>
  )
}
