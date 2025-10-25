import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { supabaseServer } from "@/lib/supabase-server"
import { z } from "zod"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = supabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: { code: "UNAUTHENTICATED", message: "Login required" } }, { status: 401 })
    }

    const profile = await prisma.profile.findUnique({ where: { id: user.id } })
    if (profile?.role !== "ADMIN") {
      return NextResponse.json({ error: { code: "FORBIDDEN", message: "Admin access required" } }, { status: 403 })
    }

    const schema = z.object({
      resolution: z.string().min(10).max(1000),
      action: z.enum(["RESOLVED", "REJECTED"])
    })

    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: { code: "INVALID_INPUT", message: parsed.error.flatten() } }, { status: 400 })
    }

    const { resolution, action } = parsed.data

    const dispute = await prisma.dispute.update({ 
      where: { id: params.id }, 
      data: { 
        status: action,
        resolution,
        resolvedAt: new Date(),
        resolvedBy: user.id
      },
      include: {
        transaction: {
          include: {
            buyer: true,
            seller: true,
            listing: true
          }
        }
      }
    })

    await prisma.adminAction.create({
      data: {
        disputeId: params.id,
        adminId: user.id,
        action: `${action}: ${resolution}`
      }
    })

    return NextResponse.json({ 
      dispute,
      message: "Dispute resolved successfully" 
    })

  } catch (error) {
    console.error("Resolve dispute error:", error)
    return NextResponse.json({ 
      error: { code: "SERVER_ERROR", message: "Failed to resolve dispute" } 
    }, { status: 500 })
  }
}
