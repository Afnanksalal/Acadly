import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { supabaseServer } from "@/lib/supabase-server"

export async function POST(req: NextRequest) {
  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: { code: "UNAUTHENTICATED", message: "Login required" } }, { status: 401 })
  }

  const profile = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!profile?.verified) {
    return NextResponse.json({ error: { code: "UNVERIFIED", message: "Account verification required" } }, { status: 403 })
  }

  const { listingId } = await req.json()
  
  if (!listingId) {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "listingId required" } }, { status: 400 })
  }

  const listing = await prisma.listing.findUnique({ where: { id: listingId } })
  
  if (!listing) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Listing not found" } }, { status: 404 })
  }

  if (listing.userId === user.id) {
    return NextResponse.json({ error: { code: "INVALID_ACTION", message: "Cannot chat with yourself" } }, { status: 400 })
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

    return NextResponse.json({ 
      success: true,
      data: { chatId: chat.id },
    })
  } catch (error) {
    console.error("Error creating/finding chat:", error)
    return NextResponse.json({ 
      error: { 
        code: "SERVER_ERROR", 
        message: "Failed to create chat" 
      } 
    }, { status: 500 })
  }
}
