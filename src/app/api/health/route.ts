import { prisma } from "@/lib/prisma"
import { successResponse, errorResponse } from "@/lib/api-response"

export async function GET() {
  try {
    const startTime = Date.now()

    // Quick database connectivity check with timeout
    const dbStart = Date.now()
    const dbPromise = prisma.$queryRaw`SELECT 1 as health_check`
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database timeout')), 5000)
    )
    
    await Promise.race([dbPromise, timeoutPromise])
    const dbTime = Date.now() - dbStart

    // Get basic statistics (cached for performance)
    const [
      userCount,
      listingCount,
      transactionCount,
      activeListings,
    ] = await Promise.all([
      prisma.profile.count(),
      prisma.listing.count(),
      prisma.transaction.count(),
      prisma.listing.count({ where: { isActive: true } }),
    ])

    // Check critical environment variables only
    const criticalEnvVars = [
      "DATABASE_URL",
      "NEXT_PUBLIC_SUPABASE_URL",
      "RAZORPAY_KEY_ID",
    ]

    const missingEnvVars = criticalEnvVars.filter(
      (varName) => !process.env[varName]
    )

    const totalTime = Date.now() - startTime

    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      environment: process.env.NODE_ENV || "unknown",
      uptime: Math.floor(process.uptime()),
      database: {
        connected: true,
        responseTime: `${dbTime}ms`,
        status: dbTime < 1000 ? "fast" : dbTime < 3000 ? "slow" : "very_slow"
      },
      statistics: {
        users: userCount,
        listings: listingCount,
        activeListings,
        transactions: transactionCount,
      },
      configuration: {
        criticalEnvVars: criticalEnvVars.length,
        missingEnvVars: missingEnvVars.length,
      },
      performance: {
        responseTime: `${totalTime}ms`,
        status: totalTime < 500 ? "fast" : totalTime < 2000 ? "acceptable" : "slow"
      },
    }

    // Determine overall health status
    if (missingEnvVars.length > 0) {
      health.status = "degraded"
    } else if (dbTime > 3000 || totalTime > 2000) {
      health.status = "slow"
    }

    const response = successResponse(health)
    
    // Add caching headers for health check
    response.headers.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60')
    
    return response
  } catch (error) {
    console.error("Health check failed:", error)
    
    const errorResponse = {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
      database: {
        connected: false,
      },
    }
    
    return new Response(JSON.stringify({ success: false, data: errorResponse }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  }
}

// Simple ping endpoint
export async function HEAD() {
  return new Response(null, { status: 200 })
}