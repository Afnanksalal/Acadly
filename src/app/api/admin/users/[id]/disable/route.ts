import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { createRouteHandlerSupabaseClient } from "@/lib/supabase-route-handler"
import { validateUUIDForAPI } from "@/lib/uuid-validation"
import { successResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from "@/lib/api-response"

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  // Validate UUID format
  const validation = validateUUIDForAPI(params.id, "user")
  if (!validation.isValid) {
    return validation.response
  }

  const supabase = createRouteHandlerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorizedResponse("Login required")
  
  const me = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!me || me.role !== "ADMIN") return forbiddenResponse("Admin only")

  const targetId = params.id
  const target = await prisma.profile.findUnique({ where: { id: targetId } })
  if (!target) return notFoundResponse("User not found")

  await prisma.profile.update({ where: { id: targetId }, data: { verified: false } })
  await prisma.adminAction.create({ data: { adminId: me.id, disputeId: (await ensureAdminLogDispute(me.id)).id, action: `DISABLED_USER:${targetId}` } })

  return successResponse({ ok: true })
}

async function ensureAdminLogDispute(adminId: string) {
  // Create a dummy dispute record to store admin actions (minimal placeholder)
  const tx = await prisma.transaction.findFirst()
  if (tx) {
    return prisma.dispute.upsert({ where: { id: tx.id }, update: {}, create: { id: tx.id, transactionId: tx.id, reporterId: adminId, subject: "ADMIN_ACTIONS", description: "Log" } })
  }
  // If no transactions yet, create a temp transactionless dispute via a throwaway tx
  const fakeTx = await prisma.transaction.create({ data: { buyerId: adminId, sellerId: adminId, listingId: (await prisma.listing.findFirst())?.id ?? adminId, amount: 0, status: "INITIATED" } })
  return prisma.dispute.create({ data: { transactionId: fakeTx.id, reporterId: adminId, subject: "ADMIN_ACTIONS", description: "Log" } })
}