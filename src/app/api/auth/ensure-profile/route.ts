import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"
import { prisma } from "@/lib/prisma"

export async function POST() {
  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: { code: "UNAUTHENTICATED", message: "Login required" } }, { status: 401 })

  const email = user.email ?? ""
  let profile = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!profile) {
    profile = await prisma.profile.create({ data: { id: user.id, email } })
  } else if (!profile.email && email) {
    profile = await prisma.profile.update({ where: { id: user.id }, data: { email } })
  }

  return NextResponse.json({ ok: true, profile })
}
