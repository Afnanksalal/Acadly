import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { successResponse, validationErrorResponse } from "@/lib/api-response"

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { transactionId } = body
  if (!transactionId) return validationErrorResponse("transactionId required")

  const pickup = await prisma.pickup.create({ data: { transactionId, pickupCode: generateCode() } })
  return successResponse(pickup, 201)
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { transactionId, code } = body
  if (!transactionId || !code) return validationErrorResponse("transactionId and code required")

  const p = await prisma.pickup.findUnique({ where: { transactionId } })
  if (!p || p.pickupCode !== code) return validationErrorResponse("Invalid code")

  await prisma.pickup.update({ where: { transactionId }, data: { status: "CONFIRMED", confirmedAt: new Date() } })
  return successResponse({ ok: true })
}