import { NextRequest, NextResponse } from "next/server"
import { cleanupExpiredTransactions, autoCompleteTransactions } from "@/lib/transaction-timeout"

/**
 * Cron job for cleaning up expired transactions and auto-completing old ones
 * 
 * Vercel Scheduling:
 * - Hobby: Daily at midnight UTC (0 0 * * *)
 * - Pro: Every 6 hours (0 star/6 * * *) - recommended for production
 * 
 * Manual trigger: GET /api/cron/cleanup with Authorization Bearer CRON_SECRET
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    console.log("Starting cleanup job...")

    // Clean up expired transactions
    const cleanupResult = await cleanupExpiredTransactions()
    console.log(`Cleaned up ${cleanupResult.cleaned} expired transactions`)

    // Auto-complete old transactions
    const autoCompleteResult = await autoCompleteTransactions()
    console.log(`Auto-completed ${autoCompleteResult.completed} transactions`)

    return NextResponse.json({
      success: true,
      results: {
        expiredTransactionsCleaned: cleanupResult.cleaned,
        transactionsAutoCompleted: autoCompleteResult.completed,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Cleanup job error:", error)
    return NextResponse.json(
      { 
        error: "Cleanup job failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// Also allow POST for manual triggers
export const POST = GET