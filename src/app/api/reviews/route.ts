import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { transactionId, reviewerId, revieweeId, rating, comment } = body
  if (!transactionId || !reviewerId || !revieweeId || !rating) return NextResponse.json({ error: "missing fields" }, { status: 400 })
  const review = await prisma.review.create({ data: { transactionId, reviewerId, revieweeId, rating, comment } })
  // update aggregates
  const agg = await prisma.review.aggregate({ _avg: { rating: true }, _count: true, where: { revieweeId } })
  await prisma.profile.update({ where: { id: revieweeId }, data: { ratingAvg: agg._avg.rating ?? 0, ratingCount: agg._count } })
  return NextResponse.json(review, { status: 201 })
}
