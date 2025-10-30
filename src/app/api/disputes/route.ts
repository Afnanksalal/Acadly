import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { supabaseServer } from "@/lib/supabase-server"
import { z } from "zod"

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const supabase = supabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ 
        error: { code: "UNAUTHENTICATED", message: "Login required" } 
      }, { status: 401 })
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
      return NextResponse.json({ 
        error: { code: "INVALID_INPUT", message: parsed.error.flatten() } 
      }, { status: 400 })
    }

    const { transactionId, subject, description, reason, evidence } = parsed.data

    // Validate evidence URLs if provided
    if (evidence && evidence.length > 0 && !validateEvidence(evidence)) {
      return NextResponse.json({ 
        error: { code: "INVALID_EVIDENCE", message: "Evidence must be valid image URLs" } 
      }, { status: 400 })
    }

    // Verify transaction exists and user is a participant
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { listing: true }
    })

    if (!transaction) {
      return NextResponse.json({ 
        error: { code: "NOT_FOUND", message: "Transaction not found" } 
      }, { status: 404 })
    }

    // Only buyer or seller can create dispute
    if (transaction.buyerId !== user.id && transaction.sellerId !== user.id) {
      return NextResponse.json({ 
        error: { code: "FORBIDDEN", message: "Only transaction participants can create disputes" } 
      }, { status: 403 })
    }

    // Check if dispute already exists
    const existingDispute = await prisma.dispute.findFirst({
      where: { 
        transactionId,
        status: { in: ["OPEN", "IN_REVIEW"] }
      }
    })

    if (existingDispute) {
      return NextResponse.json({ 
        error: { code: "ALREADY_EXISTS", message: "An open dispute already exists for this transaction" } 
      }, { status: 400 })
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

    return NextResponse.json({ 
      dispute,
      message: "Dispute created successfully. Admin will review within 24-48 hours."
    }, { status: 201 })

  } catch (error) {
    console.error("Create dispute error:", error)
    return NextResponse.json({ 
      error: { code: "SERVER_ERROR", message: "Failed to create dispute" } 
    }, { status: 500 })
  }
}

// Get user's disputes
export async function GET() {
  try {
    const supabase = supabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ 
        error: { code: "UNAUTHENTICATED", message: "Login required" } 
      }, { status: 401 })
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

    return NextResponse.json({ disputes })

  } catch (error) {
    console.error("Get disputes error:", error)
    return NextResponse.json({ 
      error: { code: "SERVER_ERROR", message: "Failed to fetch disputes" } 
    }, { status: 500 })
  }
}
