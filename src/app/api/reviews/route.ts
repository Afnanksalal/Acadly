import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { supabaseServer } from "@/lib/supabase-server"
import { z } from "zod"

// POST /api/reviews - Create a review
export async function POST(req: NextRequest) {
  try {
    const supabase = supabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ 
        error: { code: "UNAUTHENTICATED", message: "Login required" } 
      }, { status: 401 })
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
      return NextResponse.json({ 
        error: { code: "INVALID_INPUT", message: parsed.error.flatten() } 
      }, { status: 400 })
    }

    const { transactionId, revieweeId, rating, comment } = parsed.data

    // Verify transaction exists and user is a participant
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { pickup: true }
    })

    if (!transaction) {
      return NextResponse.json({ 
        error: { code: "NOT_FOUND", message: "Transaction not found" } 
      }, { status: 404 })
    }

    // Only buyer or seller can review
    if (transaction.buyerId !== user.id && transaction.sellerId !== user.id) {
      return NextResponse.json({ 
        error: { code: "FORBIDDEN", message: "Only transaction participants can leave reviews" } 
      }, { status: 403 })
    }

    // Transaction must be completed (pickup confirmed)
    if (transaction.status !== "PAID" || transaction.pickup?.status !== "CONFIRMED") {
      return NextResponse.json({ 
        error: { code: "TRANSACTION_NOT_COMPLETED", message: "Transaction must be completed before reviewing" } 
      }, { status: 400 })
    }

    // Verify reviewee is the other party
    const validReviewee = (transaction.buyerId === user.id && transaction.sellerId === revieweeId) ||
                         (transaction.sellerId === user.id && transaction.buyerId === revieweeId)
    
    if (!validReviewee) {
      return NextResponse.json({ 
        error: { code: "INVALID_REVIEWEE", message: "You can only review the other party in the transaction" } 
      }, { status: 400 })
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
      return NextResponse.json({ 
        error: { code: "ALREADY_REVIEWED", message: "You have already reviewed this transaction" } 
      }, { status: 400 })
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

    return NextResponse.json({ 
      review,
      message: "Review submitted successfully" 
    }, { status: 201 })

  } catch (error) {
    console.error("Create review error:", error)
    return NextResponse.json({ 
      error: { code: "SERVER_ERROR", message: "Failed to create review" } 
    }, { status: 500 })
  }
}

// GET /api/reviews - Get user's reviews
export async function GET(req: NextRequest) {
  try {
    const supabase = supabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ 
        error: { code: "UNAUTHENTICATED", message: "Login required" } 
      }, { status: 401 })
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

    return NextResponse.json({ reviews })

  } catch (error) {
    console.error("Get reviews error:", error)
    return NextResponse.json({ 
      error: { code: "SERVER_ERROR", message: "Failed to fetch reviews" } 
    }, { status: 500 })
  }
}
