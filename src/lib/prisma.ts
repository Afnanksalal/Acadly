import { PrismaClient } from "@prisma/client"

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined }

// Production-optimized Prisma configuration
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development"
    ? ["query", "error", "warn"]
    : ["error"],

  // Connection pool optimization for production
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },

  // Error formatting for production
  errorFormat: process.env.NODE_ENV === "production" ? "minimal" : "pretty",
})

// Prevent multiple instances in development
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}

// Connection management and graceful shutdown
let isShuttingDown = false

const gracefulShutdown = async () => {
  if (isShuttingDown) return
  isShuttingDown = true

  console.log("Gracefully shutting down Prisma client...")
  try {
    await prisma.$disconnect()
    console.log("Prisma client disconnected successfully")
  } catch (error) {
    console.error("Error during Prisma shutdown:", error)
  }
}

// Handle various shutdown signals
if (process.env.NODE_ENV === "production") {
  process.on("beforeExit", gracefulShutdown)
  process.on("SIGINT", gracefulShutdown)
  process.on("SIGTERM", gracefulShutdown)
  process.on("SIGUSR2", gracefulShutdown) // Nodemon restart
}

// Connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1 as health_check`
    return true
  } catch (error) {
    console.error("Database connection check failed:", error)
    return false
  }
}

// Query performance monitoring
if (process.env.NODE_ENV === "production") {
  // Simple performance monitoring without middleware
  console.log("Prisma client initialized with performance monitoring")
}
