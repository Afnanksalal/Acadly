import { NextRequest } from "next/server"
import { withAdminAuth } from "@/lib/auth"
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api-response"
import { z } from "zod"

// System settings schema
const settingsSchema = z.object({
  maintenanceMode: z.boolean().optional(),
  registrationEnabled: z.boolean().optional(),
  emailVerificationRequired: z.boolean().optional(),
  maxListingsPerUser: z.union([
    z.number().int().positive(),
    z.string().transform((val) => {
      const num = parseInt(val)
      if (isNaN(num) || num <= 0) {
        throw new Error("Invalid max listings per user")
      }
      return num
    })
  ]).optional(),
  maxTransactionAmount: z.union([
    z.number().positive(),
    z.string().transform((val) => {
      const num = parseFloat(val)
      if (isNaN(num) || num <= 0) {
        throw new Error("Invalid max transaction amount")
      }
      return num
    })
  ]).optional(),
  platformFeePercentage: z.union([
    z.number().min(0).max(100),
    z.string().transform((val) => {
      const num = parseFloat(val)
      if (isNaN(num) || num < 0 || num > 100) {
        throw new Error("Invalid platform fee percentage")
      }
      return num
    })
  ]).optional(),
  autoApproveListings: z.boolean().optional(),
  disputeAutoResolveHours: z.union([
    z.number().int().positive(),
    z.string().transform((val) => {
      const num = parseInt(val)
      if (isNaN(num) || num <= 0) {
        throw new Error("Invalid dispute auto resolve hours")
      }
      return num
    })
  ]).optional(),
  transactionTimeoutMinutes: z.union([
    z.number().int().positive(),
    z.string().transform((val) => {
      const num = parseInt(val)
      if (isNaN(num) || num <= 0) {
        throw new Error("Invalid transaction timeout minutes")
      }
      return num
    })
  ]).optional(),
})

// Mock settings storage (in a real app, you'd store this in database)
let systemSettings = {
  maintenanceMode: false,
  registrationEnabled: true,
  emailVerificationRequired: true,
  maxListingsPerUser: 50,
  maxTransactionAmount: 100000,
  platformFeePercentage: 2.5,
  autoApproveListings: true,
  disputeAutoResolveHours: 72,
  transactionTimeoutMinutes: 30,
}

export const GET = withAdminAuth(async (request: NextRequest, user) => {
  // Log admin settings access for security audit
  console.log(`Admin settings accessed by user: ${user.id} (${user.email})`)
  try {
    // In a real app, fetch from database
    const settings = {
      ...systemSettings,
      lastUpdated: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
    }

    return successResponse(settings)
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

    const updates = parsed.data

    // Update settings (in a real app, save to database)
    systemSettings = {
      ...systemSettings,
      ...updates,
    }

    // Log the admin action
    const changedSettings = Object.keys(updates).map(key => 
      `${key}: ${updates[key as keyof typeof updates]}`
    ).join(", ")

    console.log(`Admin ${user.id} updated system settings: ${changedSettings}`)

    // In a real app, you might want to:
    // 1. Store settings in database
    // 2. Broadcast changes to all instances
    // 3. Validate settings before applying
    // 4. Create audit log

    return successResponse({
      ...systemSettings,
      lastUpdated: new Date().toISOString(),
      updatedBy: user.id,
      message: "Settings updated successfully",
    })
  } catch (error) {
    console.error("Error updating admin settings:", error)
    return errorResponse(error, 500)
  }
})