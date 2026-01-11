import { prisma } from "@/lib/prisma"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { validateUUIDParam } from "@/lib/uuid-validation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ChatButton } from "./chat-button"
import { BuyButton } from "./buy-button"
import { ReportButton } from "@/components/report-button"
import { ImageGallery } from "./image-gallery"
import { Calendar, Tag, User as UserIcon, Star, MapPin } from "lucide-react"

export default async function ListingDetail({ params }: { params: { id: string } }) {
  // Validate UUID format first
  const validation = validateUUIDParam(params.id, "listing")
  if (!validation.isValid) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-semibold mb-4">{validation.error}</h1>
          <Link href="/listings" className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors">
            ← Back to Listings
          </Link>
        </div>
      </main>
    )
  }

  const listing = await prisma.listing.findUnique({ 
    where: { id: params.id }, 
    include: { user: true, category: true } 
  })
  
  if (!listing) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h1 className="text-2xl font-semibold mb-2">Listing not found</h1>
            <p className="text-muted-foreground mb-4">This listing may have been removed or doesn&apos;t exist.</p>
            <Link href="/listings">
              <Button>Browse Listings</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    )
  }

  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const profile = user ? await prisma.profile.findUnique({ where: { id: user.id } }) : null
  const isOwner = user?.id === listing.userId
  const canMessage = user && profile?.verified && !isOwner

  const images = Array.isArray(listing.images) ? listing.images.filter((img): img is string => typeof img === 'string') : []

  return (
    <main className="max-w-6xl mx-auto p-3 sm:p-4 lg:p-6">
      {/* Back button - mobile friendly */}
      <div className="mb-4">
        <Link href="/listings">
          <Button variant="outline" size="sm" className="text-xs sm:text-sm">
            ← Back to Listings
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Images */}
          <Card className="overflow-hidden">
            <CardContent className="p-3 sm:p-4">
              <ImageGallery images={images} title={listing.title} />
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div className="flex-1">
                  <CardTitle className="text-xl sm:text-2xl lg:text-3xl mb-2 leading-tight">{listing.title}</CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={listing.type === "PRODUCT" ? "default" : "secondary"}>
                      {listing.type}
                    </Badge>
                    <span className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      {listing.category.name}
                    </span>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-2xl sm:text-3xl font-bold text-primary">₹{listing.price.toString()}</div>
                  {!listing.isActive && (
                    <Badge variant="destructive" className="mt-1">Sold</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2 text-sm sm:text-base">Description</h3>
                <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-wrap">
                  {listing.description || "No description provided."}
                </p>
              </div>
              <div className="pt-4 border-t border-border flex flex-wrap gap-4 text-xs sm:text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                  Posted {new Date(listing.createdAt).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                  Campus Pickup
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          {/* Seller Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base sm:text-lg">Seller</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href={`/u/${listing.user.username || listing.user.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <UserIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm sm:text-base truncate">
                    {listing.user.username || listing.user.email?.split('@')[0]}
                  </p>
                  {listing.user.ratingAvg && listing.user.ratingCount > 0 && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {listing.user.ratingAvg.toFixed(1)} ({listing.user.ratingCount} reviews)
                    </p>
                  )}
                </div>
              </Link>

              {isOwner ? (
                <Alert>
                  <AlertDescription className="text-sm">This is your listing</AlertDescription>
                </Alert>
              ) : !listing.isActive ? (
                <Alert variant="destructive">
                  <AlertDescription className="text-sm">This item has been sold</AlertDescription>
                </Alert>
              ) : canMessage ? (
                <div className="space-y-3">
                  <BuyButton 
                    listingId={listing.id}
                    sellerId={listing.userId}
                    price={listing.price.toString()}
                    title={listing.title}
                    buyerEmail={profile?.email}
                    buyerName={profile?.name || profile?.username || undefined}
                    buyerPhone={profile?.phone || undefined}
                  />
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or</span>
                    </div>
                  </div>
                  <ChatButton listingId={listing.id} />
                  <a href={`mailto:${listing.user.email}?subject=Interested in ${listing.title}`} className="block">
                    <Button variant="outline" className="w-full text-sm">
                      📧 Email Seller
                    </Button>
                  </a>
                </div>
              ) : !user ? (
                <Alert variant="warning">
                  <AlertDescription className="text-sm">
                    <Link href="/auth/login" className="underline font-medium">Login</Link> to contact the seller
                  </AlertDescription>
                </Alert>
              ) : !profile?.verified ? (
                <Alert variant="warning">
                  <AlertDescription className="text-sm">
                    Your account needs to be verified to contact sellers
                  </AlertDescription>
                </Alert>
              ) : null}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base sm:text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {isOwner && (
                <Link href={`/listings/${listing.id}/edit`} className="block">
                  <Button variant="secondary" className="w-full text-sm">
                    ✏️ Edit Listing
                  </Button>
                </Link>
              )}
              {!isOwner && user && (
                <ReportButton
                  targetType="LISTING"
                  targetId={listing.id}
                  targetUserId={listing.userId}
                  variant="outline"
                  className="w-full text-sm"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
