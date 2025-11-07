import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withVerifiedAuth } from "@/lib/auth"
import { successResponse, validationErrorResponse, forbiddenResponse } from "@/lib/api-response"

export const dynamic = 'force-dynamic'

export const POST = withVerifiedAuth(async (req: NextRequest, user) => {
  const body = await req.json()
  const { listingId, buyerId, sellerId } = body
  
  if (!listingId || !buyerId || !sellerId) {
    return validationErrorResponse("listingId, buyerId, sellerId required")
  }

  // Verify user is either buyer or seller
  if (user.id !== buyerId && user.id !== sellerId) {
    return forbiddenResponse("You can only create chats for your own transactions")
  }

  const chat = await prisma.chat.upsert({
    where: { listingId_buyerId_sellerId: { listingId, buyerId, sellerId } },
    update: {},
    create: { listingId, buyerId, sellerId }
  })
  
  return successResponse(chat, 201)
})