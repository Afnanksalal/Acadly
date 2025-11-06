import { prisma } from "@/lib/prisma"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ProfileEditForm } from "./profile-edit-form"
import { TrophySection } from "@/components/profile/trophy-section"
import { BadgeSection } from "@/components/profile/badge-section"
import { ProjectSection } from "@/components/profile/project-section"
import { PaperSection } from "@/components/profile/paper-section"
import { ClubSection } from "@/components/profile/club-section"
import { EventSection } from "@/components/profile/event-section"

export default async function ProfilePage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect("/auth/login")

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    include: {
      _count: {
        select: {
          listings: true,
          purchases: true,
          sales: true,
          reviewsReceived: true
        }
      },
      reviewsReceived: {
        take: 5,
        orderBy: { createdAt: "desc" },
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
                  title: true
                }
              }
            }
          }
        }
      }
    }
  })

  if (!profile) redirect("/dashboard")

  return (
    <main className="max-w-6xl mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">Manage your account information</p>
        </div>
        {profile.username && (
          <Link href={`/u/${profile.username}`} className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto text-xs sm:text-sm">View Public Profile</Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Profile Stats */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Listings</span>
                <Badge variant="secondary">{profile._count.listings}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Purchases</span>
                <Badge variant="secondary">{profile._count.purchases}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Sales</span>
                <Badge variant="secondary">{profile._count.sales}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Reviews</span>
                <Badge variant="secondary">{profile._count.reviewsReceived}</Badge>
              </div>
              {profile.ratingCount > 0 && (
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{profile.ratingAvg.toFixed(1)}</span>
                    <span className="text-secondary">★</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Based on {profile.ratingCount} {profile.ratingCount === 1 ? "review" : "reviews"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Reviews */}
          {profile.reviewsReceived.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Reviews</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.reviewsReceived.map((review) => (
                  <div key={review.id} className="pb-4 border-b border-border last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < review.rating ? "text-secondary" : "text-gray-300"}>
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-muted-foreground mb-2">{review.comment}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>By {review.reviewer.username || review.reviewer.email?.split('@')[0]}</span>
                      <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Profile Edit Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfileEditForm profile={profile} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Achievements & Portfolio Section */}
      <div className="space-y-4 sm:space-y-6">
        <h2 className="text-xl sm:text-2xl font-bold">Achievements & Portfolio</h2>
        
        {/* Top Row - Badges and Trophies */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <BadgeSection userId={profile.id} isOwner={true} />
          <TrophySection userId={profile.id} isOwner={true} />
        </div>
        
        {/* Middle Row - Projects and Papers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <ProjectSection userId={profile.id} isOwner={true} />
          <PaperSection userId={profile.id} isOwner={true} />
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
