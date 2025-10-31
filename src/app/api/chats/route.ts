import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { successResponse, validationErrorResponse } from "@/lib/api-response"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { listingId, buyerId, sellerId } = body
  if (!listingId || !buyerId || !sellerId) return validationErrorResponse("listingId, buyerId, sellerId required")

  const chat = await prisma.chat.upsert({
    where: { listingId_buyerId_sellerId: { listingId, buyerId, sellerId } },
    update: {},
    create: { listingId, buyerId, sellerId }
  })
  
  return successResponse(chat, 201)
}