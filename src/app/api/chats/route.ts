import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { listingId, buyerId, sellerId } = body
  if (!listingId || !buyerId || !sellerId) return NextResponse.json({ error: "listingId, buyerId, sellerId required" }, { status: 400 })
  const chat = await prisma.chat.upsert({
    where: { listingId_buyerId_sellerId: { listingId, buyerId, sellerId } },
    update: {},
    create: { listingId, buyerId, sellerId },
  })
  return NextResponse.json(chat, { status: 201 })
}
