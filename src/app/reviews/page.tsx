import { prisma } from "@/lib/prisma"
import { supabaseServer } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { ReviewsTabs } from "./reviews-tabs"

export default async function ReviewsPage() {
  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect("/auth/login")

  const profile = await prisma.profile.findUnique({ 
    where: { id: user.id }
  })

  if (!profile) redirect("/dashboard")

  // Get reviews given by user
  const reviewsGiven = await prisma.review.findMany({
    where: { reviewerId: user.id },
    include: {
      reviewee: {
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
    },
    orderBy: { createdAt: "desc" }
  })

  // Get reviews received by user
  const reviewsReceived = await prisma.review.findMany({
    where: { revieweeId: user.id },
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
    },
    orderBy: { createdAt: "desc" }
  })

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">My Reviews</h1>
        <p className="text-muted-foreground mt-2">View all reviews you&apos;ve given and received</p>
      </div>

      {/* Rating Summary */}
      {profile.ratingCount > 0 && (
        <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <div className="text-6xl font-bold text-primary">{profile.ratingAvg.toFixed(1)}</div>
                <div className="flex items-center justify-center gap-1 mt-2">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`text-2xl ${i < Math.round(profile.ratingAvg) ? "text-yellow-500" : "text-gray-300"}`}>
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Based on {profile.ratingCount} {profile.ratingCount === 1 ? "review" : "reviews"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews Tabs */}
      <ReviewsTabs reviewsReceived={reviewsReceived} reviewsGiven={reviewsGiven} />
    </main>
  )
}
