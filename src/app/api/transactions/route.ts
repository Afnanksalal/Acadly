import { NextRequest, NextResponse } from "next/server"
import Razorpay from "razorpay"
import { prisma } from "@/lib/prisma"
import { supabaseServer } from "@/lib/supabase-server"
import { z } from "zod"

export async function POST(req: NextRequest) {
  try {
    const supabase = supabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ 
        error: { code: "UNAUTHENTICATED", message: "Login required" } 
      }, { status: 401 })
    }

    const schema = z.object({
      sellerId: z.string().uuid(),
      listingId: z.string().uuid(),
      amount: z.union([z.number(), z.string()]).optional(),
    })
    
    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ 
        error: { code: "INVALID_INPUT", message: "Invalid request data" } 
      }, { status: 400 })
    }
    
    const { sellerId, listingId, amount } = parsed.data
    
    // Buyer is always the current user
    const buyerId = user.id
    
    // CRITICAL: Prevent self-purchase
    if (buyerId === sellerId) {
      return NextResponse.json({ 
        error: { code: "FORBIDDEN", message: "You cannot buy your own listing" } 
      }, { status: 403 })
    }
    
    const profile = await prisma.profile.findUnique({ where: { id: user.id } })
    if (!profile || !profile.verified) {
      return NextResponse.json({ 
        error: { code: "NOT_VERIFIED", message: "Please verify your account to make purchases" } 
      }, { status: 403 })
    }

    const listing = await prisma.listing.findUnique({ where: { id: listingId } })
    
    if (!listing) {
      return NextResponse.json({ 
        error: { code: "NOT_FOUND", message: "Listing not found" } 
      }, { status: 404 })
    }
    
    if (!listing.isActive) {
      return NextResponse.json({ 
        error: { code: "UNAVAILABLE", message: "This item is no longer available" } 
      }, { status: 400 })
    }
    
    if (listing.userId !== sellerId) {
      return NextResponse.json({ 
        error: { code: "FORBIDDEN", message: "Invalid seller for this listing" } 
      }, { status: 403 })
    }

    // Use listing price if amount not provided
    const finalAmount = amount || listing.price.toString()
    
    // Validate Razorpay credentials
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay credentials not configured')
      return NextResponse.json({ 
        error: { code: "SERVER_ERROR", message: "Payment gateway not configured" } 
      }, { status: 500 })
    }
    
    const instance = new Razorpay({ 
      key_id: process.env.RAZORPAY_KEY_ID, 
      key_secret: process.env.RAZORPAY_KEY_SECRET 
    })
    
    const order = await instance.orders.create({ 
      amount: Math.round(Number(finalAmount) * 100), 
      currency: "INR" 
    })

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
    
    console.log('Transaction created:', { id: tx.id, orderId: order.id, amount: finalAmount })

    return NextResponse.json({ order, transaction: tx }, { status: 201 })
    
  } catch (error) {
    console.error('Create transaction error:', error)
    
    // Handle Razorpay errors
    if (error && typeof error === 'object' && 'error' in error) {
      const razorpayError = error as { error: { description?: string } }
      return NextResponse.json({ 
        error: { 
          code: "PAYMENT_ERROR", 
          message: razorpayError.error.description || "Payment gateway error" 
        } 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      error: { 
        code: "SERVER_ERROR", 
        message: "Failed to create transaction. Please try again." 
      } 
    }, { status: 500 })
  }
}
