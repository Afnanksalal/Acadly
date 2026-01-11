import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withVerifiedAuth } from "@/lib/auth"
import { successResponse, errorResponse, validationErrorResponse, notFoundResponse } from "@/lib/api-response"
import { createOfferSchema, validateAndSanitizeBody } from "@/lib/validation"
import { z } from "zod"
import { checkRateLimit, RATE_LIMITS, getClientIdentifier } from "@/lib/rate-limit"
import { notifyNewOffer, notifyOfferResponse } from "@/lib/notifications"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

/**
 * Create a system message in chat for offer events
 */
async function createOfferMessage(
  chatId: string, 
  senderId: string, 
  offerType: 'PROPOSED' | 'COUNTERED' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'EXPIRED',
  price: number,
  proposerName: string
): Promise<void> {
  const messages: Record<string, string> = {
    PROPOSED: `💰 ${proposerName} made an offer: ₹${price.toLocaleString()}`,
    COUNTERED: `🔄 ${proposerName} countered with: ₹${price.toLocaleString()}`,
    ACCEPTED: `✅ Offer of ₹${price.toLocaleString()} was accepted!`,
    DECLINED: `❌ Offer of ₹${price.toLocaleString()} was declined`,
    CANCELLED: `🚫 Offer of ₹${price.toLocaleString()} was cancelled`,
    EXPIRED: `⏰ Offer of ₹${price.toLocaleString()} has expired`
  }
  
  await prisma.message.create({
    data: {
      chatId,
      senderId,
      text: messages[offerType],
      readStatus: 'SENT'
    }
  })
  
  // Update chat timestamp
  await prisma.chat.update({
    where: { id: chatId },
    data: { updatedAt: new Date() }
  })
}

export const POST = withVerifiedAuth(async (request: NextRequest, user) => {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request, user.id)
    const rateLimitResult = checkRateLimit(clientId, RATE_LIMITS.offers)
    
    if (!rateLimitResult.success) {
      return validationErrorResponse(
        `Too many offers. Please try again in ${Math.ceil((rateLimitResult.retryAfter || 60) / 60)} minutes.`
      )
    }

    let body
    try {
      body = await request.json()
    } catch {
      return validationErrorResponse("Invalid request body")
    }

    let data
    try {
      data = validateAndSanitizeBody(createOfferSchema)(body)
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return validationErrorResponse(validationError.errors[0]?.message || "Invalid offer data")
      }
      return validationErrorResponse("Invalid offer data")
    }

    // Verify chat exists and user is a participant
    const chat = await prisma.chat.findUnique({
      where: { id: data.chatId },
      include: {
        listing: true,
        buyer: { select: { id: true, username: true, email: true } },
        seller: { select: { id: true, username: true, email: true } }
      },
    })

    if (!chat) {
      return notFoundResponse("Chat not found")
    }

    if (chat.buyerId !== user.id && chat.sellerId !== user.id) {
      return validationErrorResponse("You are not a participant in this chat")
    }

    // Check if listing is still active
    if (!chat.listing.isActive) {
      return validationErrorResponse("This listing is no longer available")
    }

    // Validate offer price (must be reasonable)
    const listingPrice = parseFloat(chat.listing.price.toString())
    const offerPrice = parseFloat(data.price.toString())
    
    if (offerPrice <= 0) {
      return validationErrorResponse("Offer price must be greater than 0")
    }
    
    // Offer must be at least 10% of listing price (prevent spam offers)
    if (offerPrice < listingPrice * 0.1) {
      return validationErrorResponse("Offer must be at least 10% of the listing price")
    }
    
    // Offer cannot exceed 200% of listing price (prevent errors)
    if (offerPrice > listingPrice * 2) {
      return validationErrorResponse("Offer cannot exceed 200% of the listing price")
    }

    // Check if there's already an active offer (and clean up expired ones)
    const activeOffer = await prisma.offer.findFirst({
      where: {
        chatId: data.chatId,
        status: { in: ["PROPOSED", "COUNTERED"] },
      },
    })

    if (activeOffer) {
      // Check if the active offer has expired
      if (activeOffer.expiresAt && activeOffer.expiresAt < new Date()) {
        // Mark as expired and create message
        await prisma.offer.update({
          where: { id: activeOffer.id },
          data: { status: "EXPIRED" }
        })
        await createOfferMessage(
          data.chatId, 
          user.id, 
          'EXPIRED', 
          parseFloat(activeOffer.price.toString()),
          'The previous offer'
        )
      } else {
        return validationErrorResponse("There is already an active offer. Please respond to it first.")
      }
    }

    // Check daily offer limit per chat (prevent spam)
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    
    const offersToday = await prisma.offer.count({
      where: {
        chatId: data.chatId,
        proposerId: user.id,
        createdAt: { gte: todayStart }
      }
    })
    
    if (offersToday >= 5) {
      return validationErrorResponse("You can only make 5 offers per day in this chat")
    }

    // Set expiration (24 hours from now)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    // Create offer
    const offer = await prisma.offer.create({
      data: {
        chatId: data.chatId,
        proposerId: user.id,
        price: data.price,
        status: "PROPOSED",
        expiresAt,
      },
      include: {
        proposer: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        chat: {
          include: {
            listing: true,
            buyer: { select: { id: true, username: true, email: true } },
            seller: { select: { id: true, username: true, email: true } }
          },
        },
      },
    })

    // Create system message in chat
    const proposerName = offer.proposer.username || offer.proposer.name || offer.proposer.email?.split('@')[0] || 'User'
    await createOfferMessage(data.chatId, user.id, 'PROPOSED', offerPrice, proposerName)

    // Send notification to other party
    try {
      await notifyNewOffer(offer.id)
    } catch (notificationError) {
      console.error("Failed to send offer notification:", notificationError)
    }

    console.log(`[OFFER] Created offer ${offer.id} for ₹${offerPrice} in chat ${data.chatId}`)

    return successResponse(offer, 201)
  } catch (error) {
    console.error("Error creating offer:", error)
    return errorResponse(error, 500)
  }
})

const updateOfferSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["ACCEPTED", "DECLINED", "CANCELLED"]),
  counterPrice: z.union([
    z.number().positive(),
    z.string().transform((val) => {
      const num = parseFloat(val)
      if (isNaN(num) || num <= 0) {
        throw new Error("Invalid counter price")
      }
      return num
    })
  ]).optional(),
})

export const PUT = withVerifiedAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const data = validateAndSanitizeBody(updateOfferSchema)(body)

    // Get offer with relations
    const offer = await prisma.offer.findUnique({
      where: { id: data.id },
      include: {
        chat: {
          include: {
            listing: true,
            buyer: { select: { id: true, username: true, email: true } },
            seller: { select: { id: true, username: true, email: true } }
          },
        },
        proposer: {
          select: { id: true, username: true, name: true, email: true }
        },
      },
    })

    if (!offer) {
      return notFoundResponse("Offer not found")
    }

    // Check if user can update this offer
    if (offer.chat.buyerId !== user.id && offer.chat.sellerId !== user.id) {
      return validationErrorResponse("You are not a participant in this chat")
    }

    // Check if offer is still active
    if (!["PROPOSED", "COUNTERED"].includes(offer.status)) {
      return validationErrorResponse("This offer is no longer active")
    }

    // Check if offer has expired
    if (offer.expiresAt && offer.expiresAt < new Date()) {
      await prisma.offer.update({
        where: { id: data.id },
        data: { status: "EXPIRED" },
      })
      await createOfferMessage(
        offer.chatId, 
        user.id, 
        'EXPIRED', 
        parseFloat(offer.price.toString()),
        'This offer'
      )
      return validationErrorResponse("This offer has expired")
    }

    const offerPrice = parseFloat(offer.price.toString())
    const responderName = user.id === offer.chat.buyerId 
      ? (offer.chat.buyer.username || offer.chat.buyer.email?.split('@')[0])
      : (offer.chat.seller.username || offer.chat.seller.email?.split('@')[0])

    let updatedOffer

    if (data.status === "ACCEPTED") {
      // Only the non-proposer can accept
      if (offer.proposerId === user.id) {
        return validationErrorResponse("You cannot accept your own offer")
      }

      updatedOffer = await prisma.offer.update({
        where: { id: data.id },
        data: { status: "ACCEPTED" },
        include: {
          proposer: {
            select: {
              id: true,
              username: true,
              name: true,
              avatarUrl: true,
            },
          },
          chat: {
            include: {
              listing: true,
            },
          },
        },
      })
      
      await createOfferMessage(offer.chatId, user.id, 'ACCEPTED', offerPrice, responderName || 'User')
      
      // Send notification
      try {
        await notifyOfferResponse(offer.id, 'ACCEPTED')
      } catch (e) {
        console.error("Failed to send offer acceptance notification:", e)
      }
      
      console.log(`[OFFER] Accepted offer ${offer.id} for ₹${offerPrice}`)
      
    } else if (data.status === "DECLINED") {
      // Only the non-proposer can decline
      if (offer.proposerId === user.id) {
        return validationErrorResponse("You cannot decline your own offer")
      }

      updatedOffer = await prisma.offer.update({
        where: { id: data.id },
        data: { status: "DECLINED" },
        include: {
          proposer: {
            select: {
              id: true,
              username: true,
              name: true,
              avatarUrl: true,
            },
          },
          chat: {
            include: {
              listing: true,
            },
          },
        },
      })
      
      await createOfferMessage(offer.chatId, user.id, 'DECLINED', offerPrice, responderName || 'User')
      
      // Send notification
      try {
        await notifyOfferResponse(offer.id, 'DECLINED')
      } catch (e) {
        console.error("Failed to send offer decline notification:", e)
      }
      
      console.log(`[OFFER] Declined offer ${offer.id}`)
      
    } else if (data.status === "CANCELLED") {
      // Only the proposer can cancel
      if (offer.proposerId !== user.id) {
        return validationErrorResponse("You can only cancel your own offers")
      }

      updatedOffer = await prisma.offer.update({
        where: { id: data.id },
        data: { status: "CANCELLED" },
        include: {
          proposer: {
            select: {
              id: true,
              username: true,
              name: true,
              avatarUrl: true,
            },
          },
          chat: {
            include: {
              listing: true,
            },
          },
        },
      })
      
      const proposerName = offer.proposer.username || offer.proposer.name || offer.proposer.email?.split('@')[0]
      await createOfferMessage(offer.chatId, user.id, 'CANCELLED', offerPrice, proposerName || 'User')
      
      console.log(`[OFFER] Cancelled offer ${offer.id}`)
    }

    return successResponse(updatedOffer)
  } catch (error) {
    console.error("Error updating offer:", error)
    return errorResponse(error, 500)
  }
})

// GET offers for a chat
export const GET = withVerifiedAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url)
    const chatId = searchParams.get('chatId')
    
    if (!chatId) {
      return validationErrorResponse("chatId is required")
    }
    
    // Verify user is a participant in this chat
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { buyerId: true, sellerId: true }
    })
    
    if (!chat) {
      return notFoundResponse("Chat not found")
    }
    
    if (chat.buyerId !== user.id && chat.sellerId !== user.id) {
      return validationErrorResponse("You are not a participant in this chat")
    }
    
    const offers = await prisma.offer.findMany({
      where: { chatId },
      include: {
        proposer: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })
    
    return successResponse(offers)
  } catch (error) {
    console.error("Error fetching offers:", error)
    return errorResponse(error, 500)
  }
})
