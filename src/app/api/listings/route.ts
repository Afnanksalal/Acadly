import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withVerifiedAuth } from "@/lib/auth"
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api-response"
import { validatePagination, createListingSchema, validateAndSanitizeBody, validateImageUrl } from "@/lib/validation"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Pagination
    const { page, limit, skip } = validatePagination({
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
    })

    // Filters
    const categoryId = searchParams.get("categoryId")
    const type = searchParams.get("type") as "PRODUCT" | "SERVICE" | null
    const search = searchParams.get("search")
    const userId = searchParams.get("userId")
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")

    // Build where clause
    const where: any = { isActive: true }

    if (categoryId) where.categoryId = categoryId
    if (type) where.type = type
    if (userId) where.userId = userId
    if (minPrice) where.price = { ...where.price, gte: parseFloat(minPrice) }
    if (maxPrice) where.price = { ...where.price, lte: parseFloat(maxPrice) }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    // Get listings with pagination
    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          category: true,
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatarUrl: true,
              ratingAvg: true,
              ratingCount: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.listing.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return successResponse(
      listings,
      200,
      {
        page,
        limit,
        total,
        totalPages,
      }
    )
  } catch (error) {
    console.error("Error fetching listings:", error)
    return errorResponse(error, 500)
  }
}

export const POST = withVerifiedAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const data = validateAndSanitizeBody(createListingSchema)(body)

    // Validate image URLs
    if (data.images.some(url => !validateImageUrl(url))) {
      return validationErrorResponse("All images must be valid image URLs")
    }

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    })

    if (!category) {
      return validationErrorResponse("Invalid category")
    }

    // Create listing
    const listing = await prisma.listing.create({
      data: {
        userId: user.id,
        title: data.title,
        description: data.description,
        price: data.price,
        categoryId: data.categoryId,
        images: data.images,
        type: data.type,
        requiresApproval: false, // Auto-approve for now
      },
      include: {
        category: true,
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
            ratingAvg: true,
            ratingCount: true,
          },
        },
      },
    })

    return successResponse(listing, 201)
  } catch (error) {
    console.error("Error creating listing:", error)
    return errorResponse(error, 500)
  }
})
