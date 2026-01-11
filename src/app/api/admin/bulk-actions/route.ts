import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminAuth } from "@/lib/auth"
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api-response"
import { createNotification } from "@/lib/notifications"
import { z } from "zod"

export const dynamic = 'force-dynamic'

const bulkActionSchema = z.object({
  action: z.enum([
    "verify_users",
    "unverify_users",
    "disable_users",
    "activate_listings",
    "deactivate_listings",
    "delete_listings",
    "resolve_disputes",
    "reject_disputes",
    "send_notifications",
    "export_data"
  ]),
  targetIds: z.array(z.string().uuid()).min(1).max(500),
  reason: z.string().max(500).optional(),
  notificationMessage: z.string().max(500).optional(),
  notificationTitle: z.string().max(100).optional()
})

export const POST = withAdminAuth(async (request: NextRequest, admin) => {
  try {
    const body = await request.json()
    const parsed = bulkActionSchema.safeParse(body)

    if (!parsed.success) {
      return validationErrorResponse("Invalid bulk action data", parsed.error.errors)
    }

    const { action, targetIds, reason, notificationMessage, notificationTitle } = parsed.data
    
    const result: {
      processed: number
      failed: number
      errors: string[]
      details?: Record<string, unknown>
    } = { processed: 0, failed: 0, errors: [] }

    // Execute action within transaction for atomicity
    await prisma.$transaction(async (tx) => {
      switch (action) {
        case "verify_users": {
          const updateResult = await tx.profile.updateMany({
            where: { id: { in: targetIds }, verified: false },
            data: { verified: true }
          })
          result.processed = updateResult.count
          result.failed = targetIds.length - updateResult.count

          // Send notifications to verified users
          const verifiedUsers = await tx.profile.findMany({
            where: { id: { in: targetIds }, verified: true },
            select: { id: true }
          })
          
          for (const user of verifiedUsers) {
            await createNotification({
              userId: user.id,
              type: "SYSTEM",
              title: "Account Verified",
              message: "Your account has been verified! You can now access all features.",
              priority: "HIGH"
            })
          }
          break
        }

        case "unverify_users": {
          // Don't unverify admins
          const updateResult = await tx.profile.updateMany({
            where: { 
              id: { in: targetIds }, 
              verified: true,
              role: "USER"
            },
            data: { verified: false }
          })
          result.processed = updateResult.count
          result.failed = targetIds.length - updateResult.count

          // Notify affected users
          const affectedUsers = await tx.profile.findMany({
            where: { id: { in: targetIds }, verified: false, role: "USER" },
            select: { id: true }
          })
          
          for (const user of affectedUsers) {
            await createNotification({
              userId: user.id,
              type: "ADMIN",
              title: "Verification Revoked",
              message: reason || "Your account verification has been revoked. Please contact support.",
              priority: "HIGH"
            })
          }
          break
        }

        case "disable_users": {
          // Don't disable admins
          const usersToDisable = await tx.profile.findMany({
            where: { id: { in: targetIds }, role: "USER" },
            select: { id: true }
          })
          
          const userIdsToDisable = usersToDisable.map(u => u.id)
          
          // Disable users
          const updateResult = await tx.profile.updateMany({
            where: { id: { in: userIdsToDisable } },
            data: { verified: false }
          })
          
          // Deactivate their listings
          await tx.listing.updateMany({
            where: { userId: { in: userIdsToDisable } },
            data: { isActive: false }
          })
          
          result.processed = updateResult.count
          result.failed = targetIds.length - updateResult.count

          // Notify disabled users
          for (const userId of userIdsToDisable) {
            await createNotification({
              userId,
              type: "ADMIN",
              title: "Account Disabled",
              message: reason || "Your account has been disabled. Please contact support.",
              priority: "URGENT"
            })
          }
          break
        }

        case "activate_listings": {
          const updateResult = await tx.listing.updateMany({
            where: { id: { in: targetIds }, isActive: false },
            data: { isActive: true }
          })
          result.processed = updateResult.count
          result.failed = targetIds.length - updateResult.count

          // Notify listing owners
          const listings = await tx.listing.findMany({
            where: { id: { in: targetIds }, isActive: true },
            select: { userId: true, title: true }
          })
          
          for (const listing of listings) {
            await createNotification({
              userId: listing.userId,
              type: "SYSTEM",
              title: "Listing Activated",
              message: `Your listing "${listing.title}" has been activated.`,
              priority: "NORMAL"
            })
          }
          break
        }

        case "deactivate_listings": {
          const updateResult = await tx.listing.updateMany({
            where: { id: { in: targetIds }, isActive: true },
            data: { isActive: false }
          })
          result.processed = updateResult.count
          result.failed = targetIds.length - updateResult.count

          // Notify listing owners
          const listings = await tx.listing.findMany({
            where: { id: { in: targetIds }, isActive: false },
            select: { userId: true, title: true }
          })
          
          for (const listing of listings) {
            await createNotification({
              userId: listing.userId,
              type: "ADMIN",
              title: "Listing Deactivated",
              message: reason 
                ? `Your listing "${listing.title}" was deactivated: ${reason}`
                : `Your listing "${listing.title}" has been deactivated by admin.`,
              priority: "HIGH"
            })
          }
          break
        }

        case "delete_listings": {
          // Get listings before deletion for notifications
          const listings = await tx.listing.findMany({
            where: { id: { in: targetIds } },
            select: { id: true, userId: true, title: true }
          })
          
          const deleteResult = await tx.listing.deleteMany({
            where: { id: { in: targetIds } }
          })
          result.processed = deleteResult.count
          result.failed = targetIds.length - deleteResult.count

          // Notify owners
          for (const listing of listings) {
            await createNotification({
              userId: listing.userId,
              type: "ADMIN",
              title: "Listing Removed",
              message: reason 
                ? `Your listing "${listing.title}" was removed: ${reason}`
                : `Your listing "${listing.title}" has been removed for policy violations.`,
              priority: "HIGH"
            })
          }
          break
        }

        case "resolve_disputes": {
          const updateResult = await tx.dispute.updateMany({
            where: { 
              id: { in: targetIds },
              status: { in: ["OPEN", "IN_REVIEW"] }
            },
            data: { 
              status: "RESOLVED",
              resolution: reason || "Resolved by admin",
              resolvedAt: new Date(),
              resolvedBy: admin.id
            }
          })
          result.processed = updateResult.count
          result.failed = targetIds.length - updateResult.count

          // Notify dispute reporters
          const disputes = await tx.dispute.findMany({
            where: { id: { in: targetIds }, status: "RESOLVED" },
            include: { 
              transaction: { 
                select: { buyerId: true, sellerId: true } 
              }
            }
          })
          
          for (const dispute of disputes) {
            // Notify both parties
            await createNotification({
              userId: dispute.transaction.buyerId,
              type: "DISPUTE",
              title: "Dispute Resolved",
              message: reason || "Your dispute has been resolved.",
              priority: "HIGH"
            })
            await createNotification({
              userId: dispute.transaction.sellerId,
              type: "DISPUTE",
              title: "Dispute Resolved",
              message: reason || "A dispute involving your transaction has been resolved.",
              priority: "HIGH"
            })
          }
          break
        }

        case "reject_disputes": {
          const updateResult = await tx.dispute.updateMany({
            where: { 
              id: { in: targetIds },
              status: { in: ["OPEN", "IN_REVIEW"] }
            },
            data: { 
              status: "REJECTED",
              resolution: reason || "Rejected by admin",
              resolvedAt: new Date(),
              resolvedBy: admin.id
            }
          })
          result.processed = updateResult.count
          result.failed = targetIds.length - updateResult.count

          // Notify reporters
          const disputes = await tx.dispute.findMany({
            where: { id: { in: targetIds }, status: "REJECTED" },
            select: { reporterId: true }
          })
          
          for (const dispute of disputes) {
            await createNotification({
              userId: dispute.reporterId,
              type: "DISPUTE",
              title: "Dispute Rejected",
              message: reason || "Your dispute has been reviewed and rejected.",
              priority: "NORMAL"
            })
          }
          break
        }

        case "send_notifications": {
          // Send custom notifications to users
          const users = await tx.profile.findMany({
            where: { id: { in: targetIds } },
            select: { id: true }
          })
          
          for (const user of users) {
            await createNotification({
              userId: user.id,
              type: "ADMIN",
              title: notificationTitle || "Admin Notice",
              message: notificationMessage || "You have a new notification from admin.",
              priority: "NORMAL"
            })
          }
          
          result.processed = users.length
          result.failed = targetIds.length - users.length
          break
        }

        case "export_data": {
          // This action just returns the data, doesn't modify anything
          result.details = { exportRequested: true, targetCount: targetIds.length }
          result.processed = targetIds.length
          break
        }
      }

      // Log the bulk action
      await tx.auditLog.create({
        data: {
          userId: admin.id,
          action: `BULK_${action.toUpperCase()}`,
          resource: "BULK_ACTION",
          metadata: {
            targetCount: targetIds.length,
            processed: result.processed,
            failed: result.failed,
            reason,
            targetIds: targetIds.slice(0, 10) // Log first 10 IDs only
          }
        }
      })
    })

    return successResponse({
      action,
      targetCount: targetIds.length,
      result,
      performedBy: admin.id,
      performedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error("Error performing bulk action:", error)
    return errorResponse(error, 500)
  }
})

/**
 * GET /api/admin/bulk-actions
 * Get available bulk actions and their descriptions
 */
export const GET = withAdminAuth(async () => {
  return successResponse({
    availableActions: [
      {
        action: "verify_users",
        description: "Verify multiple user accounts",
        targetType: "users",
        requiresReason: false
      },
      {
        action: "unverify_users",
        description: "Revoke verification from multiple users",
        targetType: "users",
        requiresReason: true
      },
      {
        action: "disable_users",
        description: "Disable multiple user accounts and their listings",
        targetType: "users",
        requiresReason: true
      },
      {
        action: "activate_listings",
        description: "Activate multiple listings",
        targetType: "listings",
        requiresReason: false
      },
      {
        action: "deactivate_listings",
        description: "Deactivate multiple listings",
        targetType: "listings",
        requiresReason: true
      },
      {
        action: "delete_listings",
        description: "Permanently delete multiple listings",
        targetType: "listings",
        requiresReason: true
      },
      {
        action: "resolve_disputes",
        description: "Resolve multiple disputes",
        targetType: "disputes",
        requiresReason: true
      },
      {
        action: "reject_disputes",
        description: "Reject multiple disputes",
        targetType: "disputes",
        requiresReason: true
      },
      {
        action: "send_notifications",
        description: "Send custom notifications to multiple users",
        targetType: "users",
        requiresReason: false,
        requiresMessage: true
      }
    ],
    limits: {
      maxTargets: 500,
      maxReasonLength: 500,
      maxMessageLength: 500
    }
  })
})
