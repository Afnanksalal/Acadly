import { NextRequest } from "next/server"
import Razorpay from "razorpay"
import { prisma } from "@/lib/prisma"
import { withVerifiedAuth, validateBuyerNotSeller } from "@/lib/auth"
import { successResponse, errorResponse, notFoundResponse, validationErrorResponse } from "@/lib/api-response"
import { createTransactionSchema, validateAndSanitizeBody, validatePagination } from "@/lib/validation"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Pagination
    const { page, limit, skip } = validatePagination({
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
    })

    // Filters
    const status = searchParams.get("status")
    const userId = searchParams.get("userId")

    // Build where clause
    const where: any = {}
    if (status) where.status = status
    if (userId) {
      where.OR = [
        { buyerId: userId },
        { sellerId: userId },
      ]
    }

    // Get transactions with pagination
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          buyer: {
            select: {
              id: true,
              username: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
          seller: {
            select: {
              id: true,
              username: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
          listing: {
            include: {
              category: true,
            },
          },
          pickup: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return successResponse(
      transactions,
      200,
      {
        page,
        limit,
        total,
        totalPages,
      }
    )
  } catch (error) {
    console.error("Error fetching transactions:", error)
    return errorResponse(error, 500)
  }
}

export const POST = withVerifiedAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const data = validateAndSanitizeBody(createTransactionSchema)(body)

    // Get listing details
    const listing = await prisma.listing.findUnique({
      where: { id: data.listingId },
      include: {
        user: true,
      },
    })

    if (!listing) {
      return notFoundResponse("Listing not found")
    }

    if (!listing.isActive) {
      return validationErrorResponse("This item is no longer available")
    }

    // Validate buyer is not seller
    validateBuyerNotSeller(user.id, listing.userId)

    // Check for existing active transaction
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        listingId: data.listingId,
        status: { in: ["INITIATED", "PAID"] },
      },
    })

    if (existingTransaction) {
      return validationErrorResponse("A transaction is already in progress for this listing")
    }

    // Use listing price or provided amount
    const finalAmount: number = typeof data.amount === 'number' ? data.amount : parseFloat(listing.price.toString())

    // Validate Razorpay credentials
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error("Razorpay credentials not configured")
      return errorResponse(new Error("Payment gateway not configured"), 500)
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: Math.round(finalAmount * 100), // Convert to paise
      currency: "INR",
      notes: {
        listingId: data.listingId,
        buyerId: user.id,
        sellerId: listing.userId,
      },
    })

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        buyerId: user.id,
        sellerId: listing.userId,
        listingId: data.listingId,
        amount: finalAmount,
        status: "INITIATED",
        razorpayOrderId: order.id,
      },
      include: {
        buyer: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        seller: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        listing: {
          include: {
            category: true,
          },
        },
      },
    })

    console.log("Transaction created:", {
      id: transaction.id,
      orderId: order.id,
      amount: finalAmount,
    })

    return successResponse({
      order,
      transaction,
    }, 201)
  } catch (error) {
    console.error("Create transaction error:", error)

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message === "CANNOT_BUY_OWN_LISTING") {
        return validationErrorResponse("You cannot buy your own listing")
      }
    }

    // Handle Razorpay errors
    if (error && typeof error === "object" && "error" in error) {
      const razorpayError = error as { error: { description?: string } }
      return errorResponse(
        new Error(razorpayError.error.description || "Payment gateway error"),
        500
      )
    }

    return errorResponse(error, 500)
  }
})
