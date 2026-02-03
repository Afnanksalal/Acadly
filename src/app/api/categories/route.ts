import { prisma } from "@/lib/prisma"
import { errorResponse, successResponse } from "@/lib/api-response"

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: { parent: true },
      orderBy: [{ parentId: "asc" }, { name: "asc" }],
    })
    return successResponse(categories)
  } catch (error) {
    console.error("Failed to load categories:", error)
    return errorResponse(error, 500)
  }
}
