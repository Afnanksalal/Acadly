import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { createRouteHandlerSupabaseClient } from "@/lib/supabase-route-handler"
import { z } from "zod"
import { successResponse, errorResponse, unauthorizedResponse, validationErrorResponse, notFoundResponse, forbiddenResponse } from "@/lib/api-response"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

// POST /api/reviews - Create a review
export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return unauthorizedResponse("Login required")
    }

    const schema = z.object({
      transactionId: z.string().uuid(),
      revieweeId: z.string().uuid(),
      rating: z.union([
        z.number().int().min(1).max(5),
        z.string().transform((val) => {
          const num = parseInt(val)
          if (isNaN(num) || num < 1 || num > 5) {
            throw new Error("Rating must be between 1 and 5")
          }
          return num
        })
      ]),
      comment: z.string().max(1000).optional()
    })

    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) {
      return validationErrorResponse("Invalid input data")
    }

    const { transactionId, revieweeId, rating, comment } = parsed.data

    // Verify transaction exists and user is a participant
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { pickup: true }
    })

    if (!transaction) {
      return notFoundResponse("Transaction not found")
    }

    // Only buyer or seller can review
    if (transaction.buyerId !== user.id && transaction.sellerId !== user.id) {
      return forbiddenResponse("Only transaction participants can leave reviews")
    }

    // Transaction must be completed (pickup confirmed)
    if (transaction.status !== "PAID" || transaction.pickup?.status !== "CONFIRMED") {
      return validationErrorResponse("Transaction must be completed before reviewing")
    }

    // Verify reviewee is the other party
    const validReviewee = (transaction.buyerId === user.id && transaction.sellerId === revieweeId) ||
                         (transaction.sellerId === user.id && transaction.buyerId === revieweeId)
    
    if (!validReviewee) {
      return validationErrorResponse("You can only review the other party in the transaction")
    }

    // Check if review already exists
    const existingReview = await prisma.review.findUnique({
      where: {
        transactionId_reviewerId: {
          transactionId,
          reviewerId: user.id
        }
      }
    })

    if (existingReview) {
      return validationErrorResponse("You have already reviewed this transaction")
    }

    // Create review
    const review = await prisma.review.create({ 
      data: { 
        transactionId, 
        reviewerId: user.id, 
        revieweeId, 
        rating, 
        comment 
      },
      include: {
        reviewer: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true
          }
        }
      }
    })

    // Update reviewee's rating aggregates
    const agg = await prisma.review.aggregate({ 
      _avg: { rating: true }, 
      _count: true, 
      where: { revieweeId } 
    })
    
    await prisma.profile.update({ 
      where: { id: revieweeId }, 
      data: { 
        ratingAvg: agg._avg.rating ?? 0, 
        ratingCount: agg._count 
      } 
    })

    return successResponse({ 
      review,
      message: "Review submitted successfully" 
    }, 201)

  } catch (error) {
    console.error("Create review error:", error)
    return errorResponse(error, 500)
  }
}

// GET /api/reviews - Get user's reviews
export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return unauthorizedResponse("Login required")
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type") // "given" or "received"
    const userId = searchParams.get("userId")

    let where = {}
    
    if (type === "given") {
      where = { reviewerId: userId || user.id }
    } else if (type === "received") {
      where = { revieweeId: userId || user.id }
    } else {
      // Default: all reviews involving the user
      where = {
        OR: [
          { reviewerId: user.id },
          { revieweeId: user.id }
        ]
      }
    }

    const reviews = await prisma.review.findMany({
      where,
      include: {
        reviewer: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true
          }
        },
        reviewee: {
          select: {
            id: true,
            username: true,
            email: true
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

    return successResponse({ reviews })

  } catch (error) {
    console.error("Get reviews error:", error)
    return errorResponse(error, 500)
  }
}