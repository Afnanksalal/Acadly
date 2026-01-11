import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyWebhookSignature, parseWebhookPayload, WEBHOOK_EVENTS } from "@/lib/razorpay"
import crypto from "crypto"

// Force dynamic - webhooks must not be cached
export const dynamic = 'force-dynamic'

/**
 * POST /api/webhooks/razorpay
 * 
 * Handles Razorpay server-to-server webhooks.
 * Configure this URL in Razorpay Dashboard > Settings > Webhooks
 * 
 * Events handled:
 * - payment.captured: Payment was successful
 * - payment.failed: Payment failed
 * - refund.created: Refund was initiated
 * - refund.processed: Refund was completed
 */
export async function POST(request: NextRequest) {
  const webhookId = `webhook_${Date.now()}`
  
  try {
    // Get raw body for signature verification
    const rawBody = await request.text()
    const signature = request.headers.get('x-razorpay-signature')
    
    if (!signature) {
      console.error(`[${webhookId}] Missing webhook signature header`)
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
    }
    
    // Verify webhook signature
    const isValid = verifyWebhookSignature({
      body: rawBody,
      signature
    })
    
    if (!isValid) {
      console.error(`[${webhookId}] Invalid webhook signature`)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
    
    // Parse webhook payload
    const webhook = parseWebhookPayload(rawBody)
    if (!webhook) {
      console.error(`[${webhookId}] Invalid webhook payload`)
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }
    
    console.log(`[${webhookId}] Received webhook:`, {
      event: webhook.event,
      createdAt: new Date(webhook.createdAt * 1000).toISOString()
    })
    
    // Handle different webhook events
    switch (webhook.event) {
      case WEBHOOK_EVENTS.PAYMENT_CAPTURED:
        await handlePaymentCaptured(webhookId, webhook.payload)
        break
        
      case WEBHOOK_EVENTS.PAYMENT_FAILED:
        await handlePaymentFailed(webhookId, webhook.payload)
        break
        
      case WEBHOOK_EVENTS.REFUND_PROCESSED:
        await handleRefundProcessed(webhookId, webhook.payload)
        break
        
      case WEBHOOK_EVENTS.ORDER_PAID:
        await handleOrderPaid(webhookId, webhook.payload)
        break
        
      default:
        console.log(`[${webhookId}] Unhandled webhook event: ${webhook.event}`)
    }
    
    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true, webhookId })
    
  } catch (error) {
    console.error(`[${webhookId}] Webhook processing error:`, error)
    // Return 200 anyway to prevent Razorpay from retrying
    // Log the error for investigation
    return NextResponse.json({ received: true, error: 'Processing error logged' })
  }
}

/**
 * Handle payment.captured event
 * This is a backup for the client-side verification
 */
async function handlePaymentCaptured(
  webhookId: string,
  payload: { payment?: { entity: Record<string, unknown> } }
) {
  const payment = payload.payment?.entity
  if (!payment) {
    console.error(`[${webhookId}] Missing payment entity in payload`)
    return
  }
  
  const orderId = payment.order_id as string
  const paymentId = payment.id as string
  const status = payment.status as string
  
  console.log(`[${webhookId}] Payment captured:`, { orderId, paymentId, status })
  
  // Find transaction by Razorpay order ID
  const transaction = await prisma.transaction.findFirst({
    where: { razorpayOrderId: orderId },
    include: { listing: true, pickup: true }
  })
  
  if (!transaction) {
    console.warn(`[${webhookId}] Transaction not found for order ${orderId}`)
    return
  }
  
  // If already paid, skip (idempotent)
  if (transaction.status === "PAID") {
    console.log(`[${webhookId}] Transaction already paid, skipping`)
    return
  }
  
  // Update transaction atomically
  await prisma.$transaction(async (tx) => {
    await tx.transaction.update({
      where: { id: transaction.id },
      data: {
        status: "PAID",
        razorpayPaymentId: paymentId
      }
    })
    
    // Deactivate listing
    if (transaction.listing.isActive) {
      await tx.listing.update({
        where: { id: transaction.listingId },
        data: { isActive: false }
      })
    }
    
    // Create audit log
    await tx.auditLog.create({
      data: {
        action: "WEBHOOK_PAYMENT_CAPTURED",
        resource: "TRANSACTION",
        resourceId: transaction.id,
        metadata: {
          webhookId,
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId
        }
      }
    })
  })
  
  // Generate pickup code if not exists
  if (!transaction.pickup) {
    const code = crypto.randomInt(100000, 999999).toString()
    await prisma.pickup.create({
      data: {
        transactionId: transaction.id,
        pickupCode: code,
        status: "GENERATED"
      }
    })
    console.log(`[${webhookId}] Pickup code generated via webhook`)
  }
  
  console.log(`[${webhookId}] Transaction ${transaction.id} updated via webhook`)
}

/**
 * Handle payment.failed event
 */
async function handlePaymentFailed(
  webhookId: string,
  payload: { payment?: { entity: Record<string, unknown> } }
) {
  const payment = payload.payment?.entity
  if (!payment) return
  
  const orderId = payment.order_id as string
  const errorCode = payment.error_code as string
  const errorDescription = payment.error_description as string
  
  console.log(`[${webhookId}] Payment failed:`, { orderId, errorCode, errorDescription })
  
  // Find and update transaction
  const transaction = await prisma.transaction.findFirst({
    where: { razorpayOrderId: orderId }
  })
  
  if (!transaction) return
  
  // Only update if still INITIATED
  if (transaction.status === "INITIATED") {
    await prisma.$transaction(async (tx) => {
      await tx.transaction.update({
        where: { id: transaction.id },
        data: { status: "CANCELLED" }
      })
      
      await tx.auditLog.create({
        data: {
          action: "WEBHOOK_PAYMENT_FAILED",
          resource: "TRANSACTION",
          resourceId: transaction.id,
          metadata: {
            webhookId,
            errorCode,
            errorDescription
          }
        }
      })
    })
    
    console.log(`[${webhookId}] Transaction ${transaction.id} marked as cancelled`)
  }
}

/**
 * Handle refund.processed event
 */
async function handleRefundProcessed(
  webhookId: string,
  payload: { refund?: { entity: Record<string, unknown> } }
) {
  const refund = payload.refund?.entity
  if (!refund) return
  
  const paymentId = refund.payment_id as string
  const refundId = refund.id as string
  const amount = (refund.amount as number) / 100 // Convert from paise
  
  console.log(`[${webhookId}] Refund processed:`, { paymentId, refundId, amount })
  
  // Find transaction by payment ID
  const transaction = await prisma.transaction.findFirst({
    where: { razorpayPaymentId: paymentId }
  })
  
  if (!transaction) return
  
  await prisma.$transaction(async (tx) => {
    await tx.transaction.update({
      where: { id: transaction.id },
      data: { status: "REFUNDED" }
    })
    
    await tx.auditLog.create({
      data: {
        action: "WEBHOOK_REFUND_PROCESSED",
        resource: "TRANSACTION",
        resourceId: transaction.id,
        metadata: {
          webhookId,
          refundId,
          amount
        }
      }
    })
  })
  
  console.log(`[${webhookId}] Transaction ${transaction.id} marked as refunded`)
}

/**
 * Handle order.paid event
 */
async function handleOrderPaid(
  webhookId: string,
  payload: { order?: { entity: Record<string, unknown> } }
) {
  const order = payload.order?.entity
  if (!order) return
  
  const orderId = order.id as string
  
  console.log(`[${webhookId}] Order paid:`, { orderId })
  
  // This is similar to payment.captured but triggered at order level
  // The payment.captured handler should have already processed this
  // This serves as a backup
  
  const transaction = await prisma.transaction.findFirst({
    where: { razorpayOrderId: orderId }
  })
  
  if (!transaction) {
    console.warn(`[${webhookId}] Transaction not found for order ${orderId}`)
    return
  }
  
  if (transaction.status !== "PAID") {
    console.log(`[${webhookId}] Order paid but transaction not marked as PAID, may need investigation`)
  }
}
