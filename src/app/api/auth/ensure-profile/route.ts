import { createRouteHandlerSupabaseClient } from "@/lib/supabase-route-handler"
import { prisma } from "@/lib/prisma"
import { successResponse, unauthorizedResponse } from "@/lib/api-response"

export async function POST() {
  const supabase = createRouteHandlerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorizedResponse("Login required")

  const email = user.email ?? ""
  let profile = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!profile) {
    profile = await prisma.profile.create({ data: { id: user.id, email } })
  } else if (!profile.email && email) {
    profile = await prisma.profile.update({ where: { id: user.id }, data: { email } })
  }

  return successResponse({ ok: true, profile })
}