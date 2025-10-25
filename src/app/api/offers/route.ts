import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { supabaseServer } from "@/lib/supabase-server"
import { z } from "zod"

export async function POST(req: NextRequest) {
  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: { code: "UNAUTHENTICATED", message: "Login required" } }, { status: 401 })

  const schema = z.object({
    chatId: z.string().uuid(),
    proposerId: z.string().uuid(),
    price: z.union([z.number(), z.string()]),
    expiresAt: z.string().datetime().optional(),
  })
  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const { chatId, proposerId, price, expiresAt } = parsed.data

  if (proposerId !== user.id) return NextResponse.json({ error: { code: "FORBIDDEN", message: "User mismatch" } }, { status: 403 })
  const profile = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!profile || !profile.verified) return NextResponse.json({ error: { code: "NOT_VERIFIED", message: "Verification required" } }, { status: 403 })

  const chat = await prisma.chat.findUnique({ where: { id: chatId } })
  if (!chat || (chat.buyerId !== user.id && chat.sellerId !== user.id)) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Not a chat participant" } }, { status: 403 })
  }

  const offer = await prisma.offer.create({ data: { chatId, proposerId, price: price, expiresAt: expiresAt ? new Date(expiresAt) : undefined } })
  return NextResponse.json(offer, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: { code: "UNAUTHENTICATED", message: "Login required" } }, { status: 401 })

  const schema = z.object({ id: z.string().uuid(), status: z.enum(["PROPOSED","COUNTERED","ACCEPTED","DECLINED","EXPIRED","CANCELLED"]) })
  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const { id, status } = parsed.data

  // Only chat participants can update an offer status
  const offer = await prisma.offer.findUnique({ where: { id }, include: { chat: true } })
  if (!offer) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Offer not found" } }, { status: 404 })
  if (offer.chat.buyerId !== user.id && offer.chat.sellerId !== user.id) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Not a chat participant" } }, { status: 403 })
  }

  const updated = await prisma.offer.update({ where: { id }, data: { status } })
  return NextResponse.json(updated)
}
