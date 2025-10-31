import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { createRouteHandlerSupabaseClient } from "@/lib/supabase-route-handler"
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, validationErrorResponse, notFoundResponse } from "@/lib/api-response"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return unauthorizedResponse("Login required")
  }

  const profile = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!profile?.verified) {
    return forbiddenResponse("Account verification required")
  }

  const { listingId } = await req.json()
  
  if (!listingId) {
    return validationErrorResponse("listingId required")
  }

  const listing = await prisma.listing.findUnique({ where: { id: listingId } })
  
  if (!listing) {
    return notFoundResponse("Listing not found")
  }

  if (listing.userId === user.id) {
    return validationErrorResponse("Cannot chat with yourself")
  }

  try {
    // Use upsert to handle race conditions
    const chat = await prisma.chat.upsert({
      where: {
        listingId_buyerId_sellerId: {
          listingId,
          buyerId: user.id,
          sellerId: listing.userId,
        },
      },
      update: {
        updatedAt: new Date(),
      },
      create: {
        listingId,
        buyerId: user.id,
        sellerId: listing.userId,
      },
    })

    return successResponse({ chatId: chat.id })
  } catch (error) {
    console.error("Error creating/finding chat:", error)
    return errorResponse(error, 500)
  }
}
