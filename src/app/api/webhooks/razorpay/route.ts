import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { notifyPaymentReceived, notifyPickupCodeGenerated } from "@/lib/notifications"

export async function POST(req: NextRequest) {
  try {
    // Verify webhook secret is configured
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error("RAZORPAY_WEBHOOK_SECRET not configured")
      return new NextResponse("Server configuration error", { status: 500 })
    }

    const text = await req.text()
    const signature = req.headers.get("x-razorpay-signature")
    
    // Strict validation: Check for missing signature
    if (!signature) {
      console.error("Missing webhook signature")
      return new NextResponse("Unauthorized - Missing signature", { status: 401 })
    }
    
    // Verify signature with timing-safe comparison
    const expected = crypto
      .createHmac("sha256", webhookSecret)
      .update(text)
      .digest("hex")
    
    // Use crypto.timingSafeEqual for secure comparison (prevents timing attacks)
    const expectedBuffer = Buffer.from(expected, 'hex')
    const receivedBuffer = Buffer.from(signature, 'hex')
    
    if (expectedBuffer.length !== receivedBuffer.length || 
        !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)) {
      console.error("Invalid webhook signature", {
        expected,
        received: signature,
        bodyLength: text.length
      })
      return new NextResponse("Unauthorized - Invalid signature", { status: 401 })
    }

    // Safe to parse after signature verification
    let event
    try {
      event = JSON.parse(text)
    } catch (parseError) {
      console.error("Failed to parse webhook payload:", parseError)
      return new NextResponse("Invalid JSON payload", { status: 400 })
    }

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
          const transactions = await prisma.transaction.findMany({ 
            where: { razorpayOrderId: orderId, status: "PAID" },
            include: { listing: true, pickup: true }
          })
          
          for (const tx of transactions) {
            try {
              // Send payment received notification
              await notifyPaymentReceived(tx.id)
              
              // Generate pickup code if not exists
              if (!tx.pickup) {
                await prisma.pickup.create({
                  data: {
                    transactionId: tx.id,
                    pickupCode: Math.floor(100000 + Math.random() * 900000).toString(),
                    status: "GENERATED"
                  }
                })
                console.log(`Pickup code generated for transaction ${tx.id}`)
                
                // Send pickup code notification
                await notifyPickupCodeGenerated(tx.id)
              }
              
              // Mark listing as sold (no longer active)
              if (tx.listing.isActive) {
                await prisma.listing.update({
                  where: { id: tx.listingId },
                  data: { isActive: false }
                })
                console.log(`Listing ${tx.listingId} marked as sold`)
              }
            } catch (error) {
              console.error(`Error processing transaction ${tx.id}:`, error)
              // Continue processing other transactions
            }
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
          const transactions = await prisma.transaction.findMany({ 
            where: { razorpayOrderId: orderId, status: "PAID" },
            include: { listing: true, pickup: true }
          })
          
          for (const tx of transactions) {
            try {
              // Send payment received notification (fallback)
              await notifyPaymentReceived(tx.id)
              
              // Generate pickup code if not exists
              if (!tx.pickup) {
                await prisma.pickup.create({
                  data: {
                    transactionId: tx.id,
                    pickupCode: Math.floor(100000 + Math.random() * 900000).toString(),
                    status: "GENERATED"
                  }
                })
                console.log(`Pickup code generated for transaction ${tx.id} (fallback)`)
                
                // Send pickup code notification (fallback)
                await notifyPickupCodeGenerated(tx.id)
              }
              
              // Mark listing as sold
              if (tx.listing.isActive) {
                await prisma.listing.update({
                  where: { id: tx.listingId },
                  data: { isActive: false }
                })
                console.log(`Listing ${tx.listingId} marked as sold (fallback)`)
              }
            } catch (error) {
              console.error(`Error processing transaction ${tx.id} (fallback):`, error)
              // Continue processing other transactions
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
