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
  const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  try {
    const body = await request.json()
    const data = validateAndSanitizeBody(createTransactionSchema)(body)

    // Input validation with additional checks
    if (!data.listingId || typeof data.listingId !== 'string') {
      return validationErrorResponse("Invalid listing ID provided")
    }

    // Use database transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Get listing with row-level locking
      const listing = await tx.listing.findUnique({
        where: { id: data.listingId },
        include: { user: true },
      })

      if (!listing) {
        throw new Error("LISTING_NOT_FOUND")
      }

      if (!listing.isActive) {
        throw new Error("LISTING_INACTIVE")
      }

      // Validate buyer is not seller
      validateBuyerNotSeller(user.id, listing.userId)

      // Check for existing active transaction with proper locking
      const existingTransaction = await tx.transaction.findFirst({
        where: {
          listingId: data.listingId,
          status: { in: ["INITIATED", "PAID"] },
        },
      })

      if (existingTransaction) {
        throw new Error("TRANSACTION_IN_PROGRESS")
      }

      // Validate user's transaction limits (prevent spam)
      const recentTransactions = await tx.transaction.count({
        where: {
          buyerId: user.id,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      })

      if (recentTransactions >= 10) { // Max 10 transactions per day
        throw new Error("TRANSACTION_LIMIT_EXCEEDED")
      }

      return { listing }
    })

    const { listing } = result

    // Use listing price or provided amount with validation
    const finalAmount: number = typeof data.amount === 'number' ? data.amount : parseFloat(listing.price.toString())
    
    // Validate amount bounds
    if (finalAmount < 1 || finalAmount > 999999) {
      return validationErrorResponse("Transaction amount must be between ₹1 and ₹999,999")
    }

    // Validate Razorpay credentials
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error(`[${transactionId}] Razorpay credentials not configured`)
      return errorResponse(new Error("Payment gateway not configured"), 500)
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })

    // Create Razorpay order with retry logic
    let order: any = null
    let retries = 3
    
    while (retries > 0) {
      try {
        order = await razorpay.orders.create({
          amount: Math.round(finalAmount * 100), // Convert to paise
          currency: "INR",
          receipt: transactionId,
          notes: {
            listingId: data.listingId,
            buyerId: user.id,
            sellerId: listing.userId,
            transactionId
          },
        })
        break
      } catch (razorpayError) {
        retries--
        if (retries === 0) throw razorpayError
        await new Promise(resolve => setTimeout(resolve, 1000)) // 1 second delay
      }
    }

    if (!order) {
      throw new Error("Failed to create Razorpay order after retries")
    }

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

    console.log(`[${transactionId}] Transaction created successfully:`, {
      id: transaction.id,
      orderId: order.id,
      amount: finalAmount,
      buyer: user.id,
      seller: listing.userId
    })

    return successResponse({
      order,
      transaction,
      transactionId
    }, 201)
  } catch (error) {
    console.error(`[${transactionId}] Create transaction error:`, error)

    // Handle specific business logic errors
    if (error instanceof Error) {
      switch (error.message) {
        case "CANNOT_BUY_OWN_LISTING":
          return validationErrorResponse("You cannot buy your own listing")
        case "LISTING_NOT_FOUND":
          return notFoundResponse("Listing not found")
        case "LISTING_INACTIVE":
          return validationErrorResponse("This item is no longer available")
        case "TRANSACTION_IN_PROGRESS":
          return validationErrorResponse("A transaction is already in progress for this listing")
        case "TRANSACTION_LIMIT_EXCEEDED":
          return validationErrorResponse("Daily transaction limit exceeded. Please try again tomorrow.")
      }
    }

    // Handle Razorpay errors with better context
    if (error && typeof error === "object" && "error" in error) {
      const razorpayError = error as { error: { description?: string; code?: string } }
      console.error(`[${transactionId}] Razorpay error:`, razorpayError)
      
      return errorResponse(
        new Error(`Payment gateway error: ${razorpayError.error.description || 'Unknown error'}`),
        500
      )
    }

    return errorResponse(error, 500)
  }
})
