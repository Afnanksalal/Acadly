import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminAuth } from "@/lib/auth"
import { successResponse, errorResponse, notFoundResponse, validationErrorResponse } from "@/lib/api-response"
import { z } from "zod"

const updateUserSchema = z.object({
  verified: z.boolean().optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
  notes: z.string().max(500).optional(),
})

export const GET = withAdminAuth(async (request: NextRequest, user) => {
  // Log admin user detail access for security audit
  console.log(`Admin user detail accessed by user: ${user.id} (${user.email})`)
  try {
    const url = new URL(request.url)
    const userId = url.pathname.split("/")[4] // /api/admin/users/[id]

    if (!userId) {
      return validationErrorResponse("User ID is required")
    }

    const targetUser = await prisma.profile.findUnique({
      where: { id: userId },
      include: {
        listings: {
          select: {
            id: true,
            title: true,
            price: true,
            isActive: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        purchases: {
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
            listing: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        sales: {
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
            listing: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        disputes: {
          select: {
            id: true,
            subject: true,
            status: true,
            reason: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        reviewsReceived: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            reviewer: {
              select: {
                id: true,
                username: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: {
          select: {
            listings: true,
            purchases: true,
            sales: true,
            reviewsReceived: true,
            disputes: true,
          },
        },
      },
    })

    if (!targetUser) {
      return notFoundResponse("User not found")
    }

    return successResponse(targetUser)
  } catch (error) {
    console.error("Error fetching user:", error)
    return errorResponse(error, 500)
  }
})

export const PUT = withAdminAuth(async (request: NextRequest, user) => {
  try {
    const url = new URL(request.url)
    const userId = url.pathname.split("/")[4] // /api/admin/users/[id]

    if (!userId) {
      return validationErrorResponse("User ID is required")
    }

    const body = await request.json()
    const parsed = updateUserSchema.safeParse(body)

    if (!parsed.success) {
      return validationErrorResponse("Invalid input data", parsed.error.errors)
    }

    const { verified, role, notes } = parsed.data

    // Check if user exists
    const existingUser = await prisma.profile.findUnique({
      where: { id: userId },
    })

    if (!existingUser) {
      return notFoundResponse("User not found")
    }

    // Prevent admin from demoting themselves
    if (userId === user.id && role === "USER") {
      return validationErrorResponse("You cannot demote yourself from admin")
    }

    // Update user
    const updatedUser = await prisma.profile.update({
      where: { id: userId },
      data: {
        ...(verified !== undefined && { verified }),
        ...(role && { role }),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        avatarUrl: true,
        phone: true,
        department: true,
        year: true,
        role: true,
        verified: true,
        ratingAvg: true,
        ratingCount: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            listings: true,
            purchases: true,
            sales: true,
            reviewsReceived: true,
            disputes: true,
          },
        },
      },
    })

    // Log admin action
    const changes = []
    if (verified !== undefined && verified !== existingUser.verified) {
      changes.push(`Verification: ${existingUser.verified} → ${verified}`)
    }
    if (role && role !== existingUser.role) {
      changes.push(`Role: ${existingUser.role} → ${role}`)
    }

    if (changes.length > 0 || notes) {
      // Note: AdminAction requires disputeId, so we'll skip logging for user updates
      // In a real app, you might want a separate UserAction table
      console.log(`Admin ${user.id} updated user ${existingUser.email}: ${changes.join(", ")}${notes ? ` | Notes: ${notes}` : ""}`)
    }

    return successResponse({
      user: updatedUser,
      message: "User updated successfully",
    })
  } catch (error) {
    console.error("Error updating user:", error)
    return errorResponse(error, 500)
  }
})