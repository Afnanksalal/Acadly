import { prisma } from "@/lib/prisma"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { validateUUIDParam } from "@/lib/uuid-validation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ChatButton } from "./chat-button"
import { BuyButton } from "./buy-button"

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

  const images = Array.isArray(listing.images) ? listing.images : []

  return (
    <main className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          {images.length > 0 ? (
            <Card className="overflow-hidden">
              <div className="aspect-video w-full bg-muted relative">
                <Image src={images[0] as string} alt={listing.title} fill className="object-cover" />
              </div>
              {images.length > 1 && (
                <CardContent className="p-4">
                  <div className="flex gap-2 overflow-x-auto">
                    {images.slice(1).map((img, i) => (
                      <Image key={i} src={img as string} alt={`${listing.title} ${i + 2}`} width={80} height={80} className="w-20 h-20 object-cover rounded-md border border-border" />
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ) : (
            <Card>
              <div className="aspect-video w-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <span className="text-6xl opacity-30">📷</span>
              </div>
            </Card>
          )}

          {/* Details */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-3xl mb-2">{listing.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={listing.type === "PRODUCT" ? "default" : "secondary"}>
                      {listing.type}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{listing.category.name}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary">₹{listing.price.toString()}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {listing.description || "No description provided."}
                </p>
              </div>
              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Posted {new Date(listing.createdAt).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Seller Card */}
          <Card>
            <CardHeader>
              <CardTitle>Seller</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-xl">
                  👤
                </div>
                <div>
                  <p className="font-medium">{listing.user.email?.split('@')[0]}</p>
                  <p className="text-xs text-muted-foreground">{listing.user.email}</p>
                </div>
              </div>

              {isOwner ? (
                <Alert>
                  <AlertDescription>This is your listing</AlertDescription>
                </Alert>
              ) : canMessage ? (
                <div className="space-y-3">
                  <BuyButton 
                    listingId={listing.id}
                    sellerId={listing.userId}
                    price={listing.price.toString()}
                    title={listing.title}
                  />
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or</span>
                    </div>
                  </div>
                  <ChatButton listingId={listing.id} />
                  <a href={`mailto:${listing.user.email}?subject=Interested in ${listing.title}`} className="block">
                    <Button variant="outline" className="w-full">
                      📧 Email Seller
                    </Button>
                  </a>
                </div>
              ) : !user ? (
                <Alert variant="warning">
                  <AlertDescription>
                    <Link href="/auth/login" className="underline">Login</Link> to contact the seller
                  </AlertDescription>
                </Alert>
              ) : !profile?.verified ? (
                <Alert variant="warning">
                  <AlertDescription>
                    Your account needs to be verified to contact sellers
                  </AlertDescription>
                </Alert>
              ) : null}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/listings" className="block">
                <Button variant="outline" className="w-full">
                  ← Back to Listings
                </Button>
              </Link>
              {isOwner && (
                <Button variant="secondary" className="w-full">
                  Edit Listing
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
