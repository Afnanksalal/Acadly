import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET() {
  const items = await prisma.listing.findMany({ where: { isActive: true }, orderBy: { createdAt: "desc" } })
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: { code: "UNAUTHENTICATED", message: "Login required" } }, { status: 401 })

  const schema = z.object({
    userId: z.string().uuid(),
    title: z.string().min(3).max(120),
    description: z.string().max(4000).default(""),
    price: z.union([z.number(), z.string()]),
    categoryId: z.string().uuid(),
    images: z.array(z.string().url()).default([]),
    type: z.enum(["PRODUCT", "SERVICE"]).default("PRODUCT"),
    requiresApproval: z.boolean().optional()
  })
  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const data = parsed.data
  if (data.userId !== user.id) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "User mismatch" } }, { status: 403 })
  }
  const profile = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!profile || !profile.verified) {
    return NextResponse.json({ error: { code: "NOT_VERIFIED", message: "Verification required" } }, { status: 403 })
  }
  const listing = await prisma.listing.create({
    data: {
      userId: data.userId,
      title: data.title,
      description: data.description,
      price: data.price,
      categoryId: data.categoryId,
      images: data.images,
      type: data.type,
      requiresApproval: data.requiresApproval ?? false,
    },
  })
  return NextResponse.json(listing, { status: 201 })
}
