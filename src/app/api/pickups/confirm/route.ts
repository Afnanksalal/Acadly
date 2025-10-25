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

    const { transactionId, pickupCode } = await req.json()
    
    if (!transactionId || !pickupCode) {
      return NextResponse.json({ 
        error: { code: "INVALID_INPUT", message: "Transaction ID and pickup code required" } 
      }, { status: 400 })
    }

    // Get transaction and verify user is the seller
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { 
        listing: true,
        buyer: true,
        seller: true
      }
    })

    if (!transaction) {
      return NextResponse.json({ 
        error: { code: "NOT_FOUND", message: "Transaction not found" } 
      }, { status: 404 })
    }

    if (transaction.sellerId !== user.id) {
      return NextResponse.json({ 
        error: { code: "FORBIDDEN", message: "Only seller can confirm pickup" } 
      }, { status: 403 })
    }

    // Get pickup record
    const pickup = await prisma.pickup.findUnique({
      where: { transactionId }
    })

    if (!pickup) {
      return NextResponse.json({ 
        error: { code: "NOT_FOUND", message: "Pickup code not generated yet" } 
      }, { status: 404 })
    }

    if (pickup.status === "CONFIRMED") {
      return NextResponse.json({ 
        error: { code: "ALREADY_CONFIRMED", message: "Pickup already confirmed" } 
      }, { status: 400 })
    }

    // Verify pickup code
    if (pickup.pickupCode !== pickupCode) {
      return NextResponse.json({ 
        error: { code: "INVALID_CODE", message: "Invalid pickup code" } 
      }, { status: 400 })
    }

    // Update pickup status and transaction
    const [updatedPickup, updatedTransaction] = await prisma.$transaction([
      prisma.pickup.update({
        where: { transactionId },
        data: { 
          status: "CONFIRMED",
          confirmedAt: new Date()
        }
      }),
      prisma.transaction.update({
        where: { id: transactionId },
        data: { status: "PAID" } // Keep as PAID, pickup is confirmed
      })
    ])

    return NextResponse.json({ 
      pickup: updatedPickup,
      transaction: updatedTransaction,
      message: "Pickup confirmed successfully! Transaction completed."
    }, { status: 200 })

  } catch (error) {
    console.error("Confirm pickup error:", error)
    return NextResponse.json({ 
      error: { code: "SERVER_ERROR", message: "Failed to confirm pickup" } 
    }, { status: 500 })
  }
}
