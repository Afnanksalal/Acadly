import { NextRequest, NextResponse } from "next/server"
import Razorpay from "razorpay"
import { prisma } from "@/lib/prisma"
import { supabaseServer } from "@/lib/supabase-server"
import { z } from "zod"

export async function POST(req: NextRequest) {
  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: { code: "UNAUTHENTICATED", message: "Login required" } }, { status: 401 })

  const schema = z.object({
    sellerId: z.string().uuid(),
    listingId: z.string().uuid(),
    amount: z.union([z.number(), z.string()]).optional(),
  })
  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const { sellerId, listingId, amount } = parsed.data
  
  // Buyer is always the current user
  const buyerId = user.id
  const profile = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!profile || !profile.verified) return NextResponse.json({ error: { code: "NOT_VERIFIED", message: "Verification required" } }, { status: 403 })

  const listing = await prisma.listing.findUnique({ where: { id: listingId } })
  if (!listing) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Listing not found" } }, { status: 404 })
  if (listing.userId !== sellerId) return NextResponse.json({ error: { code: "FORBIDDEN", message: "Seller mismatch for listing" } }, { status: 403 })

  // Use listing price if amount not provided
  const finalAmount = amount || listing.price.toString()
  
  const instance = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID as string, key_secret: process.env.RAZORPAY_KEY_SECRET as string })
  const order = await instance.orders.create({ amount: Math.round(Number(finalAmount) * 100), currency: "INR" })

  const tx = await prisma.transaction.create({
    data: {
      buyerId,
      sellerId,
      listingId,
      amount: amount ?? finalAmount,
      status: "INITIATED",
      razorpayOrderId: order.id,
    }
  })

  return NextResponse.json({ order, transaction: tx }, { status: 201 })
}
