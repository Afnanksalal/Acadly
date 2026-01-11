import Link from "next/link"
import Image from "next/image"
import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Prisma } from "@prisma/client"
import { ListingsSearch } from "./listings-search"

type ListingWithCategory = Prisma.ListingGetPayload<{
  include: { category: true }
}>

export async function ListingsContent({
  searchParams
}: {
  searchParams: { search?: string; category?: string; type?: string }
}) {
  const { search, category, type } = searchParams

  // Build where clause for filtering
  const where: Prisma.ListingWhereInput = {
    isActive: true,
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
        { description: { contains: search, mode: 'insensitive' as Prisma.QueryMode } }
      ]
    }),
    ...(category && { categoryId: category }),
    ...(type && { type: type as 'PRODUCT' | 'SERVICE' })
  }

  const [listings, categories] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 48,
      include: { category: true }
    }),
    prisma.category.findMany({
      where: { parentId: null },
      orderBy: { name: 'asc' }
    })
  ])

  return (
    <main className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6 pt-4 sm:pt-6 space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Browse Listings</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {listings.length} {search || category || type ? 'matching' : 'available'} items
          </p>
        </div>
        <Link href="/listings/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto hover-lift" size="md">
            <span className="text-sm sm:text-lg mr-1">+</span> 
            <span className="hidden xs:inline">Create </span>Listing
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <ListingsSearch 
        categories={categories}
        initialSearch={search}
        initialCategory={category}
        initialType={type}
      />

      {listings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            {search || category || type ? (
              <>
                <p className="text-lg opacity-80 mb-2">No listings found</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Try adjusting your search or filters
                </p>
                <Link href="/listings">
                  <Button variant="outline">Clear Filters</Button>
                </Link>
              </>
            ) : (
              <>
                <p className="text-lg opacity-80 mb-4">No listings yet</p>
                <Link href="/listings/new">
                  <Button>Create the first listing</Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
          {listings.map((l: ListingWithCategory) => {
            const images = Array.isArray(l.images) ? l.images : []
            const firstImage = typeof images[0] === 'string' ? images[0] : undefined
            return (
              <Link key={l.id} href={`/listings/${l.id}`} className="group">
                <Card className="overflow-hidden hover:border-primary transition-all h-full hover-lift">
                  {firstImage ? (
                    <div className="aspect-square sm:aspect-video w-full bg-muted overflow-hidden relative">
                      <Image src={firstImage} alt={l.title} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="aspect-square sm:aspect-video w-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <span className="text-2xl sm:text-4xl opacity-30">📷</span>
                    </div>
                  )}
                  <CardContent className="p-2 sm:p-3 lg:p-4 space-y-1 sm:space-y-2">
                    <div className="flex items-start justify-between gap-1 sm:gap-2">
                      <h3 className="font-medium line-clamp-2 flex-1 text-xs sm:text-sm">{l.title}</h3>
                      <Badge variant={l.type === "PRODUCT" ? "default" : "secondary"} className="text-xs shrink-0 hidden sm:inline-flex">
                        {l.type}
                      </Badge>
                    </div>
                    <p className="text-xs opacity-60 line-clamp-1">{l.category.name}</p>
                    <p className="text-sm sm:text-lg font-semibold text-primary">₹{l.price.toString()}</p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </main>
  )
}
