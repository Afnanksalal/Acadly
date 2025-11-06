import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminAuth } from "@/lib/auth"
import { successResponse, errorResponse, notFoundResponse, validationErrorResponse } from "@/lib/api-response"
import { z } from "zod"
import { notifyAccountVerified, notifySecurityAlert } from "@/lib/notifications"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  username: z.string().min(3).max(50).optional(),
  department: z.string().max(100).optional(),
  year: z.string().max(20).optional(),
  verified: z.boolean().optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
  bio: z.string().max(500).optional()
})

// GET /api/admin/users/[id] - Get user details
export const GET = withAdminAuth(async (request: NextRequest, adminUser) => {
  try {
    // Extract user ID from URL path
    const userId = request.url.split('/').pop()
    
    if (!userId) {
      return validationErrorResponse("User ID is required")
    }

    const user = await prisma.profile.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            listings: true,
            purchases: true,
            sales: true,
            reviewsReceived: true,
            reviewsGiven: true,
            disputes: true,
            notifications: true
          }
        },
        listings: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: { category: true }
        },
        purchases: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: { 
            listing: { select: { title: true } },
            seller: { select: { email: true, name: true } }
          }
        },
        sales: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: { 
            listing: { select: { title: true } },
            buyer: { select: { email: true, name: true } }
          }
        },
        reviewsReceived: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            reviewer: { select: { email: true, name: true } },
            transaction: { include: { listing: { select: { title: true } } } }
          }
        }
      }
    })

    if (!user) {
      return notFoundResponse("User not found")
    }

    return successResponse(user)
  } catch (error) {
    console.error("Error fetching user details:", error)
    return errorResponse(error, 500)
  }
})

// PUT /api/admin/users/[id] - Update user
export const PUT = withAdminAuth(async (request: NextRequest, adminUser) => {
  try {
    // Extract user ID from URL path
    const userId = request.url.split('/').pop()
    
    if (!userId) {
      return validationErrorResponse("User ID is required")
    }
    
    const body = await request.json()
    
    const parsed = updateUserSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse("Invalid user data", parsed.error.errors)
    }

    const data = parsed.data

    // Check if user exists
    const existingUser = await prisma.profile.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return notFoundResponse("User not found")
    }

    // Check if username is already taken (if updating username)
    if (data.username && data.username !== existingUser.username) {
      const usernameExists = await prisma.profile.findUnique({
        where: { username: data.username }
      })
      if (usernameExists) {
        return validationErrorResponse("Username already taken")
      }
    }

    // Update user
    const updatedUser = await prisma.profile.update({
      where: { id: userId },
      data: {
        ...data,
        updatedAt: new Date()
      }
    })

    // Send notifications for important changes
    if (data.verified === true && !existingUser.verified) {
      // User was just verified
      await notifyAccountVerified(userId)
    }

    if (data.role === "ADMIN" && existingUser.role !== "ADMIN") {
      // User was promoted to admin
      await notifySecurityAlert(
        userId,
        "Account Promotion",
        "Your account has been promoted to administrator by an admin."
      )
    }

    return successResponse({
      user: updatedUser,
      message: "User updated successfully"
    })
  } catch (error) {
    console.error("Error updating user:", error)
    return errorResponse(error, 500)
  }
})

// DELETE /api/admin/users/[id] - Suspend/Delete user
export const DELETE = withAdminAuth(async (request: NextRequest, adminUser) => {
  try {
    // Extract user ID from URL path
    const userId = request.url.split('/').pop()
    
    if (!userId) {
      return validationErrorResponse("User ID is required")
    }
    
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action") || "suspend" // suspend or delete

    // Check if user exists
    const existingUser = await prisma.profile.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return notFoundResponse("User not found")
    }

    // Prevent admin from deleting themselves
    if (userId === adminUser.id) {
      return validationErrorResponse("Cannot delete your own account")
    }

    if (action === "delete") {
      // Hard delete user and all related data
      await prisma.$transaction(async (tx) => {
        // Delete in correct order to handle foreign key constraints
        await tx.notification.deleteMany({ where: { userId } })
        await tx.review.deleteMany({ where: { OR: [{ reviewerId: userId }, { revieweeId: userId }] } })
        await tx.message.deleteMany({ where: { senderId: userId } })
        await tx.dispute.deleteMany({ where: { reporterId: userId } })
        await tx.pickup.deleteMany({ 
          where: { 
            transaction: { 
              OR: [{ buyerId: userId }, { sellerId: userId }] 
            } 
          } 
        })
        await tx.transaction.deleteMany({ where: { OR: [{ buyerId: userId }, { sellerId: userId }] } })
        await tx.listing.deleteMany({ where: { userId } })
        await tx.profile.delete({ where: { id: userId } })
      })

      return successResponse({
        message: "User and all related data deleted successfully"
      })
    } else {
      // Suspend user (deactivate account)
      const suspendedUser = await prisma.profile.update({
        where: { id: userId },
        data: {
          verified: false,
          // Could add a suspended field to the schema
          updatedAt: new Date()
        }
      })

      // Deactivate all user's listings
      await prisma.listing.updateMany({
        where: { userId },
        data: { isActive: false }
      })

      // Send security alert
      await notifySecurityAlert(
        userId,
        "Account Suspended",
        "Your account has been suspended by an administrator. Contact support for more information."
      )

      return successResponse({
        user: suspendedUser,
        message: "User suspended successfully"
      })
    }
  } catch (error) {
    console.error("Error deleting/suspending user:", error)
    return errorResponse(error, 500)
  }
})