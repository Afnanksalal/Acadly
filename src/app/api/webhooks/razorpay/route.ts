import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    // Verify webhook secret is configured
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error("RAZORPAY_WEBHOOK_SECRET not configured")
      return new NextResponse("Server configuration error", { status: 500 })
    }

    const text = await req.text()
    const signature = req.headers.get("x-razorpay-signature") || ""
    
    // Verify signature
    const expected = crypto
      .createHmac("sha256", webhookSecret)
      .update(text)
      .digest("hex")
    
    if (signature !== expected) {
      console.error("Invalid Razorpay webhook signature")
      return new NextResponse("Invalid signature", { status: 401 })
    }

    // Safe to parse after signature verification
    const event = JSON.parse(text)
    console.log("Razorpay webhook event:", event.event)

    // Handle different payment events
    if (event.event === "order.paid") {
      const orderId = event.payload?.order?.entity?.id
      const paymentId = event.payload?.payment?.entity?.id
      
      if (orderId) {
        const updated = await prisma.transaction.updateMany({
          where: { razorpayOrderId: orderId, status: "INITIATED" },
          data: { 
            status: "PAID", 
            razorpayPaymentId: paymentId || null 
          },
        })
        console.log(`Updated ${updated.count} transactions for order ${orderId}`)
        
        // Generate pickup code and mark listing as sold
        if (updated.count > 0) {
          const tx = await prisma.transaction.findFirst({ 
            where: { razorpayOrderId: orderId },
            include: { listing: true }
          })
          
          if (tx) {
            // Generate pickup code
            await prisma.pickup.upsert({
              where: { transactionId: tx.id },
              create: {
                transactionId: tx.id,
                pickupCode: Math.floor(100000 + Math.random() * 900000).toString(),
                status: "GENERATED"
              },
              update: {}
            })
            
            // Mark listing as sold (no longer active)
            await prisma.listing.update({
              where: { id: tx.listingId },
              data: { isActive: false }
            })
            
            console.log(`Listing ${tx.listingId} marked as sold`)
          }
        }
      }
    }
    
    else if (event.event === "payment.captured") {
      const orderId = event.payload?.payment?.entity?.order_id
      const paymentId = event.payload?.payment?.entity?.id
      
      if (orderId) {
        const updated = await prisma.transaction.updateMany({
          where: { razorpayOrderId: orderId, status: "INITIATED" },
          data: { 
            status: "PAID", 
            razorpayPaymentId: paymentId || null 
          },
        })
        console.log(`Payment captured for order ${orderId}, updated ${updated.count} transactions`)
        
        // Generate pickup code and mark listing as sold (fallback)
        if (updated.count > 0) {
          const tx = await prisma.transaction.findFirst({ 
            where: { razorpayOrderId: orderId },
            include: { listing: true, pickup: true }
          })
          
          if (tx) {
            // Generate pickup code if not exists
            if (!tx.pickup) {
              await prisma.pickup.create({
                data: {
                  transactionId: tx.id,
                  pickupCode: Math.floor(100000 + Math.random() * 900000).toString(),
                  status: "GENERATED"
                }
              })
            }
            
            // Mark listing as sold
            if (tx.listing.isActive) {
              await prisma.listing.update({
                where: { id: tx.listingId },
                data: { isActive: false }
              })
              console.log(`Listing ${tx.listingId} marked as sold (fallback)`)
            }
          }
        }
      }
    }
    
    else if (event.event === "payment.failed") {
      const orderId = event.payload?.payment?.entity?.order_id
      
      if (orderId) {
        const updated = await prisma.transaction.updateMany({ 
          where: { razorpayOrderId: orderId, status: "INITIATED" }, 
          data: { status: "CANCELLED" } 
        })
        console.log(`Payment failed for order ${orderId}, updated ${updated.count} transactions`)
      }
    }

    return new NextResponse("ok", { status: 200 })
    
  } catch (error) {
    console.error("Razorpay webhook error:", error)
    return new NextResponse("Webhook processing error", { status: 500 })
  }
}
