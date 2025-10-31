import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { createRouteHandlerSupabaseClient } from "@/lib/supabase-route-handler"
import { z } from "zod"
import { successResponse, errorResponse, unauthorizedResponse, validationErrorResponse, notFoundResponse, forbiddenResponse } from "@/lib/api-response"

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const supabase = createRouteHandlerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return unauthorizedResponse("Login required")
    }

    // Validate input
    const schema = z.object({
      transactionId: z.string().uuid(),
      subject: z.string().min(5).max(200),
      description: z.string().min(10).max(2000),
      reason: z.enum(["NOT_AS_DESCRIBED", "NOT_RECEIVED", "DAMAGED", "FAKE", "SELLER_UNRESPONSIVE", "BUYER_UNRESPONSIVE", "PAYMENT_ISSUE", "OTHER"]),
      evidence: z.array(z.string().url()).max(5).optional()
    })

    // Custom evidence validation
    const validateEvidence = (urls: string[]) => {
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
      return urls.every(url => {
        try {
          const urlObj = new URL(url)
          return imageExtensions.some(ext => urlObj.pathname.toLowerCase().includes(ext))
        } catch {
          return false
        }
      })
    }

    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) {
      return validationErrorResponse("Invalid input data")
    }

    const { transactionId, subject, description, reason, evidence } = parsed.data

    // Validate evidence URLs if provided
    if (evidence && evidence.length > 0 && !validateEvidence(evidence)) {
      return validationErrorResponse("Evidence must be valid image URLs")
    }

    // Verify transaction exists and user is a participant
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { listing: true }
    })

    if (!transaction) {
      return notFoundResponse("Transaction not found")
    }

    // Only buyer or seller can create dispute
    if (transaction.buyerId !== user.id && transaction.sellerId !== user.id) {
      return forbiddenResponse("Only transaction participants can create disputes")
    }

    // Check if dispute already exists
    const existingDispute = await prisma.dispute.findFirst({
      where: { 
        transactionId,
        status: { in: ["OPEN", "IN_REVIEW"] }
      }
    })

    if (existingDispute) {
      return validationErrorResponse("An open dispute already exists for this transaction")
    }

    // Create dispute
    const dispute = await prisma.dispute.create({ 
      data: { 
        transactionId, 
        reporterId: user.id, 
        subject, 
        description,
        reason,
        evidence: evidence || [],
        status: "OPEN",
        priority: "MEDIUM"
      },
      include: {
        reporter: { select: { email: true } },
        transaction: { 
          include: { 
            listing: { select: { title: true } },
            buyer: { select: { email: true } },
            seller: { select: { email: true } }
          } 
        }
      }
    })

    return successResponse({ 
      dispute,
      message: "Dispute created successfully. Admin will review within 24-48 hours."
    }, 201)

  } catch (error) {
    console.error("Create dispute error:", error)
    return errorResponse(error, 500)
  }
}

// Get user's disputes
export async function GET() {
  try {
    const supabase = createRouteHandlerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return unauthorizedResponse("Login required")
    }

    const disputes = await prisma.dispute.findMany({
      where: { reporterId: user.id },
      include: {
        transaction: {
          include: {
            listing: { select: { title: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return successResponse({ disputes })

  } catch (error) {
    console.error("Get disputes error:", error)
    return errorResponse(error, 500)
  }
}