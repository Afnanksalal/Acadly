import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminAuth } from "@/lib/auth"
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api-response"
import { z } from "zod"

export const dynamic = 'force-dynamic'

// Settings schema for validation
const settingsSchema = z.object({
  maintenanceMode: z.boolean().optional(),
  registrationEnabled: z.boolean().optional(),
  emailVerificationRequired: z.boolean().optional(),
  maxListingsPerUser: z.coerce.number().int().positive().optional(),
  maxTransactionAmount: z.coerce.number().positive().optional(),
  platformFeePercentage: z.coerce.number().min(0).max(100).optional(),
  autoApproveListings: z.boolean().optional(),
  disputeAutoResolveHours: z.coerce.number().int().positive().optional(),
  transactionTimeoutMinutes: z.coerce.number().int().positive().optional(),
})

// Get settings from environment with defaults
function getSystemSettings() {
  return {
    maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
    registrationEnabled: process.env.REGISTRATION_ENABLED !== 'false',
    emailVerificationRequired: process.env.EMAIL_VERIFICATION_REQUIRED !== 'false',
    maxListingsPerUser: parseInt(process.env.MAX_LISTINGS_PER_USER || '50'),
    maxTransactionAmount: parseInt(process.env.MAX_TRANSACTION_AMOUNT || '100000'),
    platformFeePercentage: parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || '2.5'),
    autoApproveListings: process.env.AUTO_APPROVE_LISTINGS !== 'false',
    disputeAutoResolveHours: parseInt(process.env.DISPUTE_AUTO_RESOLVE_HOURS || '72'),
    transactionTimeoutMinutes: parseInt(process.env.TRANSACTION_TIMEOUT_MINUTES || '30'),
    dailyTransactionLimit: parseInt(process.env.DAILY_TRANSACTION_LIMIT || '10'),
  }
}

export const GET = withAdminAuth(async (request: NextRequest, user) => {
  try {
    const settings = getSystemSettings()

    // Get platform statistics
    const [
      totalUsers,
      verifiedUsers,
      totalListings,
      activeListings,
      totalTransactions,
      paidTransactions
    ] = await Promise.all([
      prisma.profile.count(),
      prisma.profile.count({ where: { verified: true } }),
      prisma.listing.count(),
      prisma.listing.count({ where: { isActive: true } }),
      prisma.transaction.count(),
      prisma.transaction.count({ where: { status: 'PAID' } })
    ])

    // Log access
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "SETTINGS_VIEWED",
        resource: "SYSTEM",
        metadata: { ip: request.headers.get('x-forwarded-for') }
      }
    })

    return successResponse({
      settings,
      stats: {
        totalUsers,
        verifiedUsers,
        totalListings,
        activeListings,
        totalTransactions,
        paidTransactions
      },
      lastUpdated: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV
    })
  } catch (error) {
    console.error("Error fetching admin settings:", error)
    return errorResponse(error, 500)
  }
})

export const PUT = withAdminAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const parsed = settingsSchema.safeParse(body)

    if (!parsed.success) {
      return validationErrorResponse("Invalid settings data", parsed.error.errors)
    }

    // Note: In production, settings should be managed via environment variables
    // or a proper configuration management system (e.g., AWS Parameter Store, Vault)
    // This endpoint is for viewing settings and logging changes for audit purposes
    
    const updates = parsed.data
    const changedSettings = Object.entries(updates)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ")

    // Log the attempted settings change
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "SETTINGS_UPDATE_REQUESTED",
        resource: "SYSTEM",
        metadata: {
          requestedChanges: updates,
          note: "Settings are managed via environment variables. Update .env and redeploy to apply changes."
        }
      }
    })

    return successResponse({
      message: "Settings change logged. To apply changes, update environment variables and redeploy.",
      requestedChanges: updates,
      currentSettings: getSystemSettings(),
      instructions: [
        "1. Update the relevant environment variables in your deployment platform",
        "2. Redeploy the application to apply changes",
        "3. Settings like MAINTENANCE_MODE, MAX_LISTINGS_PER_USER, etc. are controlled via env vars"
      ]
    })
  } catch (error) {
    console.error("Error updating admin settings:", error)
    return errorResponse(error, 500)
  }
})
