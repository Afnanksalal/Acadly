import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminAuth } from "@/lib/auth"
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api-response"
import { z } from "zod"

const bulkActionSchema = z.object({
  action: z.enum([
    "verify_users",
    "unverify_users", 
    "delete_users",
    "activate_listings",
    "deactivate_listings",
    "delete_listings",
    "resolve_disputes",
    "reject_disputes",
    "send_notifications",
  ]),
  targetIds: z.array(z.string().uuid()).min(1, "At least one target ID required"),
  reason: z.string().optional(),
  notificationMessage: z.string().optional(),
})

export const POST = withAdminAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const parsed = bulkActionSchema.safeParse(body)

    if (!parsed.success) {
      return validationErrorResponse("Invalid bulk action data", parsed.error.errors)
    }

    const { action, targetIds, reason, notificationMessage } = parsed.data
    const result: any = { processed: 0, errors: [] }

    switch (action) {
      case "verify_users":
        try {
          const updateResult = await prisma.profile.updateMany({
            where: { id: { in: targetIds } },
            data: { verified: true },
          })
          result.processed = updateResult.count
        } catch (error) {
          result.errors.push(`Failed to verify users: ${error}`)
        }
        break

      case "unverify_users":
        try {
          const updateResult = await prisma.profile.updateMany({
            where: { id: { in: targetIds } },
            data: { verified: false },
          })
          result.processed = updateResult.count
        } catch (error) {
          result.errors.push(`Failed to unverify users: ${error}`)
        }
        break

      case "delete_users":
        try {
          // In a real app, you might want to soft delete or archive instead
          const deleteResult = await prisma.profile.deleteMany({
            where: { 
              id: { in: targetIds },
              role: "USER", // Prevent deleting admins
            },
          })
          result.processed = deleteResult.count
        } catch (error) {
          result.errors.push(`Failed to delete users: ${error}`)
        }
        break

      case "activate_listings":
        try {
          const updateResult = await prisma.listing.updateMany({
            where: { id: { in: targetIds } },
            data: { isActive: true },
          })
          result.processed = updateResult.count
        } catch (error) {
          result.errors.push(`Failed to activate listings: ${error}`)
        }
        break

      case "deactivate_listings":
        try {
          const updateResult = await prisma.listing.updateMany({
            where: { id: { in: targetIds } },
            data: { isActive: false },
          })
          result.processed = updateResult.count
        } catch (error) {
          result.errors.push(`Failed to deactivate listings: ${error}`)
        }
        break

      case "delete_listings":
        try {
          const deleteResult = await prisma.listing.deleteMany({
            where: { id: { in: targetIds } },
          })
          result.processed = deleteResult.count
        } catch (error) {
          result.errors.push(`Failed to delete listings: ${error}`)
        }
        break

      case "resolve_disputes":
        try {
          const updateResult = await prisma.dispute.updateMany({
            where: { 
              id: { in: targetIds },
              status: { in: ["OPEN", "IN_REVIEW"] },
            },
            data: { 
              status: "RESOLVED",
              resolution: reason || "Bulk resolved by admin",
              resolvedAt: new Date(),
              resolvedBy: user.id,
            },
          })
          result.processed = updateResult.count
        } catch (error) {
          result.errors.push(`Failed to resolve disputes: ${error}`)
        }
        break

      case "reject_disputes":
        try {
          const updateResult = await prisma.dispute.updateMany({
            where: { 
              id: { in: targetIds },
              status: { in: ["OPEN", "IN_REVIEW"] },
            },
            data: { 
              status: "REJECTED",
              resolution: reason || "Bulk rejected by admin",
              resolvedAt: new Date(),
              resolvedBy: user.id,
            },
          })
          result.processed = updateResult.count
        } catch (error) {
          result.errors.push(`Failed to reject disputes: ${error}`)
        }
        break

      case "send_notifications":
        try {
          // In a real app, you'd implement actual notification sending
          console.log(`Sending notification to ${targetIds.length} users: ${notificationMessage}`)
          result.processed = targetIds.length
          result.message = "Notifications queued for delivery"
        } catch (error) {
          result.errors.push(`Failed to send notifications: ${error}`)
        }
        break

      default:
        return validationErrorResponse("Invalid action type")
    }

    // Log the bulk action
    console.log(`Admin ${user.id} performed bulk action: ${action} on ${targetIds.length} items`)

    return successResponse({
      action,
      targetCount: targetIds.length,
      result,
      performedBy: user.id,
      performedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error performing bulk action:", error)
    return errorResponse(error, 500)
  }
})