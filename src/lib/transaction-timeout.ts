import { prisma } from "./prisma"

export async function cleanupExpiredTransactions() {
  const TIMEOUT_MINUTES = 30 // 30 minutes timeout for INITIATED transactions
  const timeoutDate = new Date(Date.now() - TIMEOUT_MINUTES * 60 * 1000)

  try {
    // Find expired INITIATED transactions
    const expiredTransactions = await prisma.transaction.findMany({
      where: {
        status: "INITIATED",
        createdAt: {
          lt: timeoutDate,
        },
      },
      select: {
        id: true,
        listingId: true,
      },
    })

    if (expiredTransactions.length === 0) {
      return { cleaned: 0 }
    }

    // Update expired transactions to CANCELLED in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.transaction.updateMany({
        where: {
          id: {
            in: expiredTransactions.map(t => t.id),
          },
          status: "INITIATED",
        },
        data: {
          status: "CANCELLED",
        },
      })

      // Reactivate listings for cancelled transactions
      const listingIds = expiredTransactions.map(t => t.listingId)
      if (listingIds.length > 0) {
        await tx.listing.updateMany({
          where: {
            id: { in: listingIds },
            isActive: false,
          },
          data: {
            isActive: true,
          },
        })
      }

      return updateResult
    })

    console.log(`Cleaned up ${result.count} expired transactions`)
    return { cleaned: result.count }
  } catch (error) {
    console.error("Error cleaning up expired transactions:", error)
    return { cleaned: 0, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// Function to check if a transaction has expired
export function isTransactionExpired(createdAt: Date, timeoutMinutes: number = 30): boolean {
  const timeoutDate = new Date(Date.now() - timeoutMinutes * 60 * 1000)
  return createdAt < timeoutDate
}

// Auto-complete transactions that have been in PAID status for too long
export async function autoCompleteTransactions() {
  const AUTO_COMPLETE_DAYS = 7 // Auto-complete after 7 days
  const autoCompleteDate = new Date(Date.now() - AUTO_COMPLETE_DAYS * 24 * 60 * 60 * 1000)

  try {
    // Find PAID transactions older than 7 days without pickup confirmation
    const transactionsToComplete = await prisma.transaction.findMany({
      where: {
        status: "PAID",
        createdAt: {
          lt: autoCompleteDate,
        },
        pickup: {
          status: "GENERATED", // Not yet confirmed
        },
      },
      include: {
        pickup: true,
        listing: true,
      },
    })

    if (transactionsToComplete.length === 0) {
      return { completed: 0 }
    }

    // Auto-confirm pickups for these transactions
    const pickupIds = transactionsToComplete
      .map(t => t.pickup?.id)
      .filter(Boolean) as string[]

    if (pickupIds.length > 0) {
      await prisma.pickup.updateMany({
        where: {
          id: {
            in: pickupIds,
          },
        },
        data: {
          status: "CONFIRMED",
          confirmedAt: new Date(),
        },
      })

      // Mark listings as inactive
      const listingIds = transactionsToComplete.map(t => t.listing.id)
      await prisma.listing.updateMany({
        where: {
          id: {
            in: listingIds,
          },
        },
        data: {
          isActive: false,
        },
      })
    }

    console.log(`Auto-completed ${transactionsToComplete.length} transactions`)
    return { completed: transactionsToComplete.length }
  } catch (error) {
    console.error("Error auto-completing transactions:", error)
    throw error
  }
}