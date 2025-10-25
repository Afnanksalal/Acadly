import Link from "next/link"
import Image from "next/image"
import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Prisma } from "@prisma/client"

type ListingWithCategory = Prisma.ListingGetPayload<{
  include: { category: true }
}>

export default async function ListingsPage() {
  const listings = await prisma.listing.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    take: 48,
    include: { category: true }
  })

  return (
    <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-bold">Browse Listings</h1>
          <p className="text-sm text-muted-foreground">{listings.length} items available</p>
        </div>
        <Link href="/listings/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto hover-lift">
            <span className="text-lg mr-1">+</span> Create Listing
          </Button>
        </Link>
      </div>

      {listings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-lg opacity-80 mb-4">No listings yet</p>
            <Link href="/listings/new">
              <Button>Create the first listing</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {listings.map((l: ListingWithCategory) => {
            const images = Array.isArray(l.images) ? l.images : []
            const firstImage = typeof images[0] === 'string' ? images[0] : undefined
            return (
              <Link key={l.id} href={`/listings/${l.id}`} className="group">
                <Card className="overflow-hidden hover:border-primary transition-all h-full hover-lift">
                  {firstImage ? (
                    <div className="aspect-video w-full bg-muted overflow-hidden relative">
                      <Image src={firstImage} alt={l.title} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="aspect-video w-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <span className="text-4xl opacity-30">📷</span>
                    </div>
                  )}
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium line-clamp-2 flex-1">{l.title}</h3>
                      <Badge variant={l.type === "PRODUCT" ? "default" : "secondary"} className="text-xs shrink-0">
                        {l.type}
                      </Badge>
                    </div>
                    <p className="text-xs opacity-60">{l.category.name}</p>
                    <p className="text-lg font-semibold text-primary">₹{l.price.toString()}</p>
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
