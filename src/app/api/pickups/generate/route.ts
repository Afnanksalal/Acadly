import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { supabaseServer } from "@/lib/supabase-server"

export async function POST(req: NextRequest) {
  try {
    const supabase = supabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ 
        error: { code: "UNAUTHENTICATED", message: "Login required" } 
      }, { status: 401 })
    }

    const { transactionId } = await req.json()
    
    if (!transactionId) {
      return NextResponse.json({ 
        error: { code: "INVALID_INPUT", message: "Transaction ID required" } 
      }, { status: 400 })
    }

    // Get transaction and verify user is the buyer
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { listing: true }
    })

    if (!transaction) {
      return NextResponse.json({ 
        error: { code: "NOT_FOUND", message: "Transaction not found" } 
      }, { status: 404 })
    }

    if (transaction.buyerId !== user.id) {
      return NextResponse.json({ 
        error: { code: "FORBIDDEN", message: "Only buyer can generate pickup code" } 
      }, { status: 403 })
    }

    if (transaction.status !== "PAID") {
      return NextResponse.json({ 
        error: { code: "INVALID_STATUS", message: "Transaction must be paid" } 
      }, { status: 400 })
    }

    // Check if pickup code already exists
    const existingPickup = await prisma.pickup.findUnique({
      where: { transactionId }
    })

    if (existingPickup) {
      return NextResponse.json({ pickup: existingPickup })
    }

    // Generate 6-digit pickup code
    const pickupCode = Math.floor(100000 + Math.random() * 900000).toString()

    const pickup = await prisma.pickup.create({
      data: {
        transactionId,
        pickupCode,
        status: "GENERATED"
      }
    })

    return NextResponse.json({ pickup }, { status: 201 })

  } catch (error) {
    console.error("Generate pickup error:", error)
    return NextResponse.json({ 
      error: { code: "SERVER_ERROR", message: "Failed to generate pickup code" } 
    }, { status: 500 })
  }
}
