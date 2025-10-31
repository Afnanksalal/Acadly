import { prisma } from "@/lib/prisma"
import { successResponse, errorResponse } from "@/lib/api-response"

export async function GET() {
  try {
    const startTime = Date.now()

    // Database connectivity check
    const dbStart = Date.now()
    await prisma.profile.findFirst({ select: { id: true } })
    const dbTime = Date.now() - dbStart

    // Get basic statistics
    const [
      userCount,
      listingCount,
      transactionCount,
      activeListings,
      verifiedUsers,
    ] = await Promise.all([
      prisma.profile.count(),
      prisma.listing.count(),
      prisma.transaction.count(),
      prisma.listing.count({ where: { isActive: true } }),
      prisma.profile.count({ where: { verified: true } }),
    ])

    // Check environment variables
    const requiredEnvVars = [
      "DATABASE_URL",
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "RAZORPAY_KEY_ID",
      "NEXT_PUBLIC_RAZORPAY_KEY_ID",
    ]

    const missingEnvVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    )

    const totalTime = Date.now() - startTime

    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "unknown",
      environment: process.env.NODE_ENV || "unknown",
      uptime: process.uptime(),
      database: {
        connected: true,
        responseTime: `${dbTime}ms`,
      },
      statistics: {
        users: userCount,
        verifiedUsers,
        listings: listingCount,
        activeListings,
        transactions: transactionCount,
      },
      configuration: {
        requiredEnvVars: requiredEnvVars.length,
        missingEnvVars: missingEnvVars.length,
        ...(missingEnvVars.length > 0 && { missing: missingEnvVars }),
      },
      performance: {
        responseTime: `${totalTime}ms`,
      },
    }

    // Determine overall health status
    if (missingEnvVars.length > 0) {
      health.status = "degraded"
    }

    return successResponse(health)
  } catch (error) {
    console.error("Health check failed:", error)
    
    return errorResponse(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
        database: {
          connected: false,
        },
      },
      503
    )
  }
}

// Simple ping endpoint
export async function HEAD() {
  return new Response(null, { status: 200 })
}