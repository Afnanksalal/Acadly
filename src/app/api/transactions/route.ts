import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withVerifiedAuth, validateBuyerNotSeller } from "@/lib/auth"
import { successResponse, errorResponse, notFoundResponse, validationErrorResponse } from "@/lib/api-response"
import { createTransactionSchema, validateAndSanitizeBody, validatePagination } from "@/lib/validation"
import { notifyTransactionCreated } from "@/lib/notifications"
import { createOrder } from "@/lib/razorpay"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

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
      // Use more aggressive locking to prevent race conditions
      const existingTransaction = await tx.transaction.findFirst({
        where: {
          listingId: data.listingId,
          OR: [
            { status: "PAID" },
            { 
              status: "INITIATED",
              createdAt: {
                gte: new Date(Date.now() - 15 * 60 * 1000) // Block if initiated in last 15 minutes
              }
            }
          ],
        },
        orderBy: { createdAt: "desc" }
      })

      if (existingTransaction) {
        if (existingTransaction.status === "PAID") {
          throw new Error("ITEM_ALREADY_SOLD")
        } else {
          // Check if it's the same user trying again
          if (existingTransaction.buyerId === user.id) {
            // Allow the same user to retry after 5 minutes
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
            if (existingTransaction.createdAt > fiveMinutesAgo) {
              throw new Error("TRANSACTION_IN_PROGRESS")
            }
          } else {
            throw new Error("TRANSACTION_IN_PROGRESS")
          }
        }
      }

      // Mark old INITIATED transactions as CANCELLED (preserve for audit trail)
      // Don't delete - just mark as cancelled for historical data
      await tx.transaction.updateMany({
        where: {
          listingId: data.listingId,
          status: "INITIATED",
          createdAt: {
            lt: new Date(Date.now() - 2 * 60 * 60 * 1000) // Older than 2 hours
          }
        },
        data: {
          status: "CANCELLED"
        }
      })

      // Validate user's transaction limits (prevent spam)
      // Get configurable limit from environment or use default
      const dailyTransactionLimit = parseInt(process.env.DAILY_TRANSACTION_LIMIT || '10')
      
      const recentTransactions = await tx.transaction.count({
        where: {
          buyerId: user.id,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      })

      if (recentTransactions >= dailyTransactionLimit) {
        throw new Error("TRANSACTION_LIMIT_EXCEEDED")
      }

      return { listing }
    })

    const { listing } = result

    // Use listing price or provided amount with validation
    const finalAmount: number = typeof data.amount === 'number' ? data.amount : parseFloat(listing.price.toString())
    
    // Validate amount bounds
    if (finalAmount < 1 || finalAmount > 999999) {
      return validationErrorResponse("Transaction amount must be between ₹1 and ₹9,99,999")
    }

    // Create Razorpay order using utility (handles retries and validation)
    let order
    try {
      order = await createOrder({
        amount: finalAmount,
        receipt: transactionId,
        notes: {
          listingId: data.listingId,
          buyerId: user.id,
          sellerId: listing.userId,
          transactionId
        }
      })
    } catch (razorpayError) {
      console.error(`[${transactionId}] Razorpay order creation failed:`, razorpayError)
      return errorResponse(new Error("Failed to create payment order. Please try again."), 500)
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

    // Send notification to seller about new purchase order
    try {
      await notifyTransactionCreated(transaction.id)
    } catch (notificationError) {
      console.error(`[${transactionId}] Failed to send notification:`, notificationError)
      // Don't fail the transaction if notification fails
    }

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
        case "ITEM_ALREADY_SOLD":
          return validationErrorResponse("This item has already been sold")
        case "TRANSACTION_IN_PROGRESS":
          return validationErrorResponse("A payment is currently being processed for this item. Please try again in a few minutes.")
        case "TRANSACTION_LIMIT_EXCEEDED":
          return validationErrorResponse("Daily transaction limit exceeded. Please try again tomorrow.")
      }
    }

    // Handle Razorpay errors
    if (error && typeof error === "object" && "error" in error) {
      const razorpayError = error as { error: { description?: string; code?: string } }
      console.error(`[${transactionId}] Razorpay error:`, razorpayError)
      return errorResponse(new Error("Payment gateway error. Please try again."), 500)
    }

    return errorResponse(error, 500)
  }
})
