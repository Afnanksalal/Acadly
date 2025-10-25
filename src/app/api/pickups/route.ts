import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function generateCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { transactionId } = body
  if (!transactionId) return NextResponse.json({ error: "transactionId required" }, { status: 400 })
  const pickup = await prisma.pickup.create({ data: { transactionId, pickupCode: generateCode() } })
  return NextResponse.json(pickup, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { transactionId, code } = body
  if (!transactionId || !code) return NextResponse.json({ error: "transactionId, code required" }, { status: 400 })
  const p = await prisma.pickup.findUnique({ where: { transactionId } })
  if (!p || p.pickupCode !== code) return NextResponse.json({ error: "Invalid code" }, { status: 400 })
  await prisma.pickup.update({ where: { transactionId }, data: { status: "CONFIRMED", confirmedAt: new Date() } })
  return NextResponse.json({ ok: true })
}
