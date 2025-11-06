import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminAuth } from "@/lib/auth"
import { successResponse, errorResponse } from "@/lib/api-response"

export const dynamic = 'force-dynamic'

export const POST = withAdminAuth(async (request: NextRequest) => {
  try {
    const body = await request.json()
    const { enabled, message, allowedRoles } = body

    // Store maintenance mode setting in system metrics table
    // First, delete any existing maintenance_mode entries
    await prisma.systemMetric.deleteMany({
      where: {
        name: 'maintenance_mode'
      }
    })

    // Then create a new entry
    await prisma.systemMetric.create({
      data: {
        name: 'maintenance_mode',
        value: enabled ? 1 : 0,
        unit: 'boolean',
        tags: {
          message,
          allowedRoles,
          updatedAt: new Date().toISOString()
        }
      }
    })

    return successResponse({
      success: true,
      maintenanceMode: {
        enabled,
        message,
        allowedRoles
      }
    })
  } catch (error) {
    console.error("Error toggling maintenance mode:", error)
    return errorResponse(error, 500)
  }
})