import { prisma } from "@/lib/prisma"
import { successResponse } from "@/lib/api-response"

export async function GET() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } })
  return successResponse(categories)
}