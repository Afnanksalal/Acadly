import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { supabaseServer } from "@/lib/supabase-server"
import { z } from "zod"

export async function GET(req: NextRequest) {
  const chatId = new URL(req.url).searchParams.get("chatId")
  if (!chatId) return NextResponse.json({ error: "chatId required" }, { status: 400 })
  const messages = await prisma.message.findMany({ where: { chatId }, orderBy: { createdAt: "asc" } })
  return NextResponse.json(messages)
}

export async function POST(req: NextRequest) {
  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: { code: "UNAUTHENTICATED", message: "Login required" } }, { status: 401 })

  const body = await req.json()
  const schema = z.object({
    chatId: z.string().uuid(),
    senderId: z.string().uuid(),
    content: z.string().min(1).max(4000).optional(),
    text: z.string().min(1).max(4000).optional(),
  })
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const { chatId, senderId, content, text } = parsed.data
  const messageText = content || text || ""
  
  if (!messageText) {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Message text required" } }, { status: 400 })
  }

  if (senderId !== user.id) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Sender mismatch" } }, { status: 403 })
  }

  const profile = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!profile || !profile.verified) {
    return NextResponse.json({ error: { code: "NOT_VERIFIED", message: "Verification required" } }, { status: 403 })
  }

  const chat = await prisma.chat.findUnique({ where: { id: chatId } })
  if (!chat || (chat.buyerId !== user.id && chat.sellerId !== user.id)) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Not a chat participant" } }, { status: 403 })
  }

  // Create message and update chat in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const msg = await tx.message.create({ 
      data: { chatId, senderId, text: messageText },
      include: { sender: true }
    })
    
    // Touch the chat to trigger @updatedAt
    await tx.chat.update({ 
      where: { id: chatId }, 
      data: { listingId: chat.listingId } // Update with same value to trigger @updatedAt
    })
    
    return msg
  })
  
  return NextResponse.json(result, { status: 201 })
}
