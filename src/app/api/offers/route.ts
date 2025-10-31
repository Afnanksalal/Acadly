import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withVerifiedAuth } from "@/lib/auth"
import { successResponse, errorResponse, validationErrorResponse, notFoundResponse } from "@/lib/api-response"
import { createOfferSchema, validateAndSanitizeBody } from "@/lib/validation"
import { z } from "zod"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

export const POST = withVerifiedAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const data = validateAndSanitizeBody(createOfferSchema)(body)

    // Verify chat exists and user is a participant
    const chat = await prisma.chat.findUnique({
      where: { id: data.chatId },
      include: {
        listing: true,
      },
    })

    if (!chat) {
      return notFoundResponse("Chat not found")
    }

    if (chat.buyerId !== user.id && chat.sellerId !== user.id) {
      return validationErrorResponse("You are not a participant in this chat")
    }

    // Check if there's already an active offer
    const activeOffer = await prisma.offer.findFirst({
      where: {
        chatId: data.chatId,
        status: { in: ["PROPOSED", "COUNTERED"] },
      },
    })

    if (activeOffer) {
      return validationErrorResponse("There is already an active offer in this chat")
    }

    // Set expiration (24 hours from now)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

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
          },
        },
        proposer: true,
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
      return validationErrorResponse("This offer has expired")
    }

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
    }

    return successResponse(updatedOffer)
  } catch (error) {
    console.error("Error updating offer:", error)
    return errorResponse(error, 500)
  }
})
