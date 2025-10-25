import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || ""
  let userId: string | null = null
  if (contentType.includes("application/json")) {
    const body = await req.json()
    userId = body.userId
  } else if (contentType.includes("application/x-www-form-urlencoded")) {
    const form = await req.formData()
    userId = String(form.get("userId"))
  }
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })
  await prisma.profile.update({ where: { id: userId }, data: { verified: true } })
  
  // Redirect back to dashboard instead of showing JSON
  return NextResponse.redirect(new URL("/dashboard", req.url))
}
