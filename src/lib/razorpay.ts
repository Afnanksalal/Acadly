/**
 * Razorpay Integration Utilities
 * 
 * Production-ready Razorpay payment gateway integration with:
 * - Secure signature verification using HMAC-SHA256
 * - Webhook signature validation
 * - Order creation with retry logic
 * - Proper error handling
 */

import Razorpay from 'razorpay'
import crypto from 'crypto'

// Singleton Razorpay instance
let razorpayInstance: Razorpay | null = null

/**
 * Get or create Razorpay instance (singleton pattern)
 */
export function getRazorpayInstance(): Razorpay {
  if (!razorpayInstance) {
    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET
    
    if (!keyId || !keySecret) {
      throw new Error('Razorpay credentials not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.')
    }
    
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    })
  }
  
  return razorpayInstance
}

/**
 * Verify Razorpay payment signature (checkout callback)
 * 
 * This verifies the signature returned by Razorpay Checkout after payment.
 * The signature is generated using: order_id + "|" + payment_id
 * 
 * @see https://razorpay.com/docs/payments/server-integration/nodejs/integration-steps/
 */
export function verifyPaymentSignature(params: {
  orderId: string
  paymentId: string
  signature: string
}): boolean {
  const { orderId, paymentId, signature } = params
  
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keySecret) {
    console.error('[RAZORPAY] Key secret not configured')
    return false
  }
  
  // Generate expected signature: HMAC-SHA256(order_id|payment_id, key_secret)
  const payload = `${orderId}|${paymentId}`
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(payload)
    .digest('hex')
  
  // Timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )
  } catch {
    // If buffers have different lengths, timingSafeEqual throws
    return false
  }
}

/**
 * Verify Razorpay webhook signature
 * 
 * Webhooks use a different signature scheme:
 * HMAC-SHA256(request_body, webhook_secret)
 * 
 * @see https://razorpay.com/docs/webhooks/validate-test/
 */
export function verifyWebhookSignature(params: {
  body: string | object
  signature: string
  webhookSecret?: string
}): boolean {
  const { body, signature, webhookSecret } = params
  
  const secret = webhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret) {
    console.error('[RAZORPAY] Webhook secret not configured')
    return false
  }
  
  // Body must be the raw string for signature verification
  const bodyString = typeof body === 'string' ? body : JSON.stringify(body)
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(bodyString)
    .digest('hex')
  
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )
  } catch {
    return false
  }
}

/**
 * Create Razorpay order with retry logic
 */
export async function createOrder(params: {
  amount: number  // Amount in INR (will be converted to paise)
  currency?: string
  receipt: string
  notes?: Record<string, string>
  partialPayment?: boolean
}): Promise<{
  id: string
  amount: number
  currency: string
  receipt: string
  status: string
}> {
  const razorpay = getRazorpayInstance()
  
  const { amount, currency = 'INR', receipt, notes, partialPayment = false } = params
  
  // Validate amount
  if (amount < 1) {
    throw new Error('Amount must be at least ₹1')
  }
  
  if (amount > 999999) {
    throw new Error('Amount cannot exceed ₹9,99,999')
  }
  
  // Convert to paise (smallest currency unit)
  const amountInPaise = Math.round(amount * 100)
  
  // Retry logic for transient failures
  let lastError: Error | null = null
  const maxRetries = 3
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency,
        receipt,
        notes,
        partial_payment: partialPayment,
      })
      
      console.log(`[RAZORPAY] Order created: ${order.id} for ₹${amount}`)
      
      return {
        id: order.id,
        amount: Number(order.amount),
        currency: order.currency,
        receipt: order.receipt || receipt,
        status: order.status,
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.warn(`[RAZORPAY] Order creation attempt ${attempt}/${maxRetries} failed:`, lastError.message)
      
      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000))
      }
    }
  }
  
  throw lastError || new Error('Failed to create Razorpay order')
}

/**
 * Fetch payment details from Razorpay
 */
export async function fetchPayment(paymentId: string) {
  const razorpay = getRazorpayInstance()
  
  try {
    const payment = await razorpay.payments.fetch(paymentId)
    return payment
  } catch (error) {
    console.error(`[RAZORPAY] Failed to fetch payment ${paymentId}:`, error)
    throw error
  }
}

/**
 * Fetch order details from Razorpay
 */
export async function fetchOrder(orderId: string) {
  const razorpay = getRazorpayInstance()
  
  try {
    const order = await razorpay.orders.fetch(orderId)
    return order
  } catch (error) {
    console.error(`[RAZORPAY] Failed to fetch order ${orderId}:`, error)
    throw error
  }
}

/**
 * Initiate refund for a payment
 */
export async function createRefund(params: {
  paymentId: string
  amount?: number  // Partial refund amount in INR (optional, full refund if not specified)
  notes?: Record<string, string>
  speed?: 'normal' | 'optimum'
}) {
  const razorpay = getRazorpayInstance()
  
  const { paymentId, amount, notes, speed = 'normal' } = params
  
  try {
    const refundParams: {
      amount?: number
      notes?: Record<string, string>
      speed?: 'normal' | 'optimum'
    } = {
      speed,
    }
    
    if (amount) {
      refundParams.amount = Math.round(amount * 100) // Convert to paise
    }
    
    if (notes) {
      refundParams.notes = notes
    }
    
    const refund = await razorpay.payments.refund(paymentId, refundParams)
    
    console.log(`[RAZORPAY] Refund created for payment ${paymentId}`)
    
    return refund
  } catch (error) {
    console.error(`[RAZORPAY] Failed to create refund for ${paymentId}:`, error)
    throw error
  }
}

/**
 * Razorpay webhook event types
 */
export const WEBHOOK_EVENTS = {
  PAYMENT_AUTHORIZED: 'payment.authorized',
  PAYMENT_CAPTURED: 'payment.captured',
  PAYMENT_FAILED: 'payment.failed',
  ORDER_PAID: 'order.paid',
  REFUND_CREATED: 'refund.created',
  REFUND_PROCESSED: 'refund.processed',
  REFUND_FAILED: 'refund.failed',
} as const

export type WebhookEvent = typeof WEBHOOK_EVENTS[keyof typeof WEBHOOK_EVENTS]

/**
 * Parse and validate webhook payload
 */
export function parseWebhookPayload(body: string | object): {
  event: string
  payload: {
    payment?: { entity: Record<string, unknown> }
    order?: { entity: Record<string, unknown> }
    refund?: { entity: Record<string, unknown> }
  }
  createdAt: number
} | null {
  try {
    const data = typeof body === 'string' ? JSON.parse(body) : body
    
    if (!data.event || !data.payload) {
      console.error('[RAZORPAY] Invalid webhook payload structure')
      return null
    }
    
    return {
      event: data.event,
      payload: data.payload,
      createdAt: data.created_at,
    }
  } catch (error) {
    console.error('[RAZORPAY] Failed to parse webhook payload:', error)
    return null
  }
}
