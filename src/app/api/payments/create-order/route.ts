import { NextRequest, NextResponse } from "next/server"
import Razorpay from "razorpay"
import { supabaseServer } from "@/lib/supabase-server"

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

    // Validate environment
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error("Razorpay credentials not configured")
      return NextResponse.json({ 
        error: { code: "SERVER_ERROR", message: "Payment system not configured" } 
      }, { status: 500 })
    }

    const body = await req.json()
    
    // Validate input
    if (!body.amount || isNaN(Number(body.amount)) || Number(body.amount) <= 0) {
      return NextResponse.json({ 
        error: { code: "INVALID_INPUT", message: "Valid amount required" } 
      }, { status: 400 })
    }

    const instance = new Razorpay({ 
      key_id: process.env.RAZORPAY_KEY_ID, 
      key_secret: process.env.RAZORPAY_KEY_SECRET 
    })
    
    try {
      const order = await instance.orders.create({
        amount: Math.round(Number(body.amount) * 100),
        currency: "INR",
        receipt: body.receipt ?? `receipt_${Date.now()}`
      })
      
      return NextResponse.json(order)
    } catch (error) {
      console.error("Payment order creation error:", error)
      return NextResponse.json({ 
        error: { code: "SERVER_ERROR", message: "Failed to create payment order" } 
      }, { status: 500 })
    }
  } catch (error) {
    console.error("Payment order creation error:", error)
    return NextResponse.json({ 
      error: { code: "SERVER_ERROR", message: "Failed to create payment order" } 
    }, { status: 500 })
  }
}
