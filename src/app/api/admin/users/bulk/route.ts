import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminAuth } from "@/lib/auth"
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api-response"
import { z } from "zod"
import { notifyAccountVerified, notifySecurityAlert } from "@/lib/notifications"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

const bulkActionSchema = z.object({
  action: z.enum(["VERIFY", "SUSPEND", "PROMOTE", "DEMOTE", "DELETE"]),
  userIds: z.array(z.string().uuid()).min(1).max(100),
  reason: z.string().min(1).max(500).optional()
})

export const POST = withAdminAuth(async (request: NextRequest, adminUser) => {
  try {
    const body = await request.json()
    const parsed = bulkActionSchema.safeParse(body)

    if (!parsed.success) {
      return validationErrorResponse("Invalid bulk action data", parsed.error.errors)
    }

    const { action, userIds, reason } = parsed.data

    // Prevent admin from acting on themselves
    if (userIds.includes(adminUser.id)) {
      return validationErrorResponse("Cannot perform bulk actions on your own account")
    }

    // Get users to validate they exist
    const users = await prisma.profile.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, name: true, verified: true, role: true }
    })

    if (users.length !== userIds.length) {
      return validationErrorResponse("Some users not found")
    }

    const results: any[] = []

    switch (action) {
      case "VERIFY":
        // Verify users
        const verifyResult = await prisma.profile.updateMany({
          where: { 
            id: { in: userIds },
            verified: false // Only update unverified users
          },
          data: { verified: true, updatedAt: new Date() }
        })

        // Send notifications to newly verified users
        const unverifiedUsers = users.filter(u => !u.verified)
        await Promise.all(
          unverifiedUsers.map(user => notifyAccountVerified(user.id))
        )

        results.push({
          action: "VERIFY",
          affected: verifyResult.count,
          message: `Verified ${verifyResult.count} users`
        })
        break

      case "SUSPEND":
        // Suspend users (unverify and deactivate listings)
        await prisma.$transaction(async (tx) => {
          // Unverify users
          const suspendResult = await tx.profile.updateMany({
            where: { id: { in: userIds } },
            data: { verified: false, updatedAt: new Date() }
          })

          // Deactivate all their listings
          await tx.listing.updateMany({
            where: { userId: { in: userIds } },
            data: { isActive: false }
          })

          results.push({
            action: "SUSPEND",
            affected: suspendResult.count,
            message: `Suspended ${suspendResult.count} users`
          })
        })

        // Send security alerts
        await Promise.all(
          users.map(user => 
            notifySecurityAlert(
              user.id,
              "Account Suspended",
              reason || "Your account has been suspended by an administrator."
            )
          )
        )
        break

      case "PROMOTE":
        // Promote users to admin
        const promoteResult = await prisma.profile.updateMany({
          where: { 
            id: { in: userIds },
            role: "USER" // Only promote regular users
          },
          data: { role: "ADMIN", updatedAt: new Date() }
        })

        // Send notifications
        const regularUsers = users.filter(u => u.role === "USER")
        await Promise.all(
          regularUsers.map(user =>
            notifySecurityAlert(
              user.id,
              "Account Promotion",
              "Your account has been promoted to administrator."
            )
          )
        )

        results.push({
          action: "PROMOTE",
          affected: promoteResult.count,
          message: `Promoted ${promoteResult.count} users to admin`
        })
        break

      case "DEMOTE":
        // Demote admins to regular users
        const demoteResult = await prisma.profile.updateMany({
          where: { 
            id: { in: userIds },
            role: "ADMIN"
          },
          data: { role: "USER", updatedAt: new Date() }
        })

        // Send notifications
        const adminUsers = users.filter(u => u.role === "ADMIN")
        await Promise.all(
          adminUsers.map(user =>
            notifySecurityAlert(
              user.id,
              "Account Demotion",
              "Your administrator privileges have been revoked."
            )
          )
        )

        results.push({
          action: "DEMOTE",
          affected: demoteResult.count,
          message: `Demoted ${demoteResult.count} admins to regular users`
        })
        break

      case "DELETE":
        // Hard delete users and all related data
        let deletedCount = 0
        
        for (const userId of userIds) {
          try {
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
              deletedCount++
            })
          } catch (error) {
            console.error(`Failed to delete user ${userId}:`, error)
          }
        }

        results.push({
          action: "DELETE",
          affected: deletedCount,
          message: `Deleted ${deletedCount} users and all their data`
        })
        break

      default:
        return validationErrorResponse("Invalid action")
    }

    return successResponse({
      results,
      totalProcessed: userIds.length,
      reason: reason || `Bulk ${action.toLowerCase()} action by admin`
    })

  } catch (error) {
    console.error("Error performing bulk user action:", error)
    return errorResponse(error, 500)
  }
})