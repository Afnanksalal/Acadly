import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { TrophySection } from "@/components/profile/trophy-section"
import { BadgeSection } from "@/components/profile/badge-section"
import { ProjectSection } from "@/components/profile/project-section"
import { PaperSection } from "@/components/profile/paper-section"
import { ClubSection } from "@/components/profile/club-section"
import { EventSection } from "@/components/profile/event-section"

export default async function PublicProfilePage({ params }: { params: { username: string } }) {
  const profile = await (prisma as any).profile.findUnique({
    where: { username: params.username },
    select: {
      id: true,
      username: true,
      name: true,
      avatarUrl: true,
      bio: true,
      department: true,
      year: true,
      ratingAvg: true,
      ratingCount: true,
      createdAt: true,
      _count: {
        select: {
          listings: true,
          sales: true
        }
      },
      reviewsReceived: {
        take: 10,
        orderBy: { createdAt: "desc" },
        where: { helpful: true },
        include: {
          reviewer: {
            select: {
              id: true,
              username: true,
              email: true,
              avatarUrl: true
            }
          },
          transaction: {
            include: {
              listing: {
                select: {
                  id: true,
                  title: true
                }
              }
            }
          }
        }
      },
      listings: {
        where: { isActive: true },
        take: 6,
        orderBy: { createdAt: "desc" },
        include: {
          category: true
        }
      }
    }
  })

  if (!profile) {
    notFound()
  }

  return (
    <main className="max-w-6xl mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            <div className="flex-shrink-0">
              {profile.avatarUrl ? (
                <Image
                  src={profile.avatarUrl}
                  alt={profile.name || profile.username || "User"}
                  width={120}
                  height={120}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-[120px] h-[120px] rounded-full bg-primary/20 flex items-center justify-center text-4xl">
                  👤
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">{profile.name || profile.username}</h1>
                  <p className="text-muted-foreground text-sm sm:text-base">@{profile.username}</p>
                </div>
                {profile.ratingCount > 0 && (
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-bold">{profile.ratingAvg.toFixed(1)}</span>
                      <span className="text-secondary text-2xl">★</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {profile.ratingCount} {profile.ratingCount === 1 ? "review" : "reviews"}
                    </p>
                  </div>
                )}
              </div>

              {profile.bio && (
                <p className="text-muted-foreground mb-4">{profile.bio}</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm">
                {profile.department && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">🎓</span>
                    <span>{profile.department}</span>
                  </div>
                )}
                {profile.year && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">📅</span>
                    <span>{profile.year}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">📦</span>
                  <span>{profile._count.listings} listings</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">✅</span>
                  <span>{profile._count.sales} sales</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Active Listings */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Active Listings ({profile.listings.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {profile.listings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No active listings</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {profile.listings.map((listing: any) => (
                    <a
                      key={listing.id}
                      href={`/listings/${listing.id}`}
                      className="block border border-border rounded-lg p-4 hover:border-primary transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold line-clamp-1">{listing.title}</h3>
                        <Badge variant={listing.type === "PRODUCT" ? "default" : "secondary"}>
                          {listing.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {listing.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{listing.category.name}</span>
                        <span className="text-lg font-bold text-primary">₹{listing.price.toString()}</span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Reviews */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Reviews ({profile.reviewsReceived.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.reviewsReceived.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No reviews yet</p>
                </div>
              ) : (
                profile.reviewsReceived.map((review: any) => (
                  <div key={review.id} className="pb-4 border-b border-border last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {[...Array(5)].map((_: any, i: number) => (
                          <span key={i} className={i < review.rating ? "text-secondary" : "text-gray-300"}>
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm mb-2">{review.comment}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>By {review.reviewer.username || review.reviewer.email?.split('@')[0]}</span>
                      <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                    {review.transaction.listing && (
                      <p className="text-xs text-muted-foreground mt-1">
                        For: {review.transaction.listing.title}
                      </p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Achievements & Portfolio Section */}
      <div className="space-y-4 sm:space-y-6">
        <h2 className="text-xl sm:text-2xl font-bold">Achievements & Portfolio</h2>
        
        {/* Top Row - Badges and Trophies */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <BadgeSection userId={profile.id} isOwner={false} />
          <TrophySection userId={profile.id} isOwner={false} />
        </div>
        
        {/* Middle Row - Projects and Papers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <ProjectSection userId={profile.id} isOwner={false} />
          <PaperSection userId={profile.id} isOwner={false} />
        </div>
        
        {/* Bottom Row - Events and Clubs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <EventSection userId={profile.id} />
          <ClubSection userId={profile.id} />
        </div>
      </div>
    </main>
  )
}
