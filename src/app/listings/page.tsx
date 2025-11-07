import { Suspense } from "react"
import { ListingsContent } from "./listings-content"
import { Card, CardContent } from "@/components/ui/card"

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
    <main className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="space-y-1">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-10 w-32 bg-muted animate-pulse rounded" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
        {[...Array(10)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <div className="aspect-square sm:aspect-video w-full bg-muted animate-pulse" />
            <CardContent className="p-2 sm:p-3 lg:p-4 space-y-2">
              <div className="h-4 bg-muted animate-pulse rounded" />
              <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
              <div className="h-5 bg-muted animate-pulse rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}
