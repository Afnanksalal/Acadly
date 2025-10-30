import { NextRequest } from "next/server"
import { supabaseServer } from "./supabase-server"
import { prisma } from "./prisma"
import { unauthorizedResponse, forbiddenResponse } from "./api-response"

export interface AuthUser {
  id: string
  email: string
  name: string | null
  username: string | null
  role: "USER" | "ADMIN"
  verified: boolean
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const supabase = supabaseServer()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    // Get profile from database
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        role: true,
        verified: true,
      },
    })

    if (!profile) {
      return null
    }

    return profile
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("UNAUTHORIZED")
  }
  return user
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth()
  if (user.role !== "ADMIN") {
    throw new Error("FORBIDDEN")
  }
  return user
}

export async function requireVerifiedUser(): Promise<AuthUser> {
  const user = await requireAuth()
  if (!user.verified) {
    throw new Error("EMAIL_NOT_VERIFIED")
  }
  return user
}

// Middleware wrapper for API routes
export function withAuth(handler: (request: NextRequest, user: AuthUser) => Promise<Response>) {
  return async (request: NextRequest) => {
    try {
      const user = await requireAuth()
      return await handler(request, user)
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        return unauthorizedResponse("Authentication required")
      }
      throw error
    }
  }
}

export function withVerifiedAuth(handler: (request: NextRequest, user: AuthUser) => Promise<Response>) {
  return async (request: NextRequest) => {
    try {
      const user = await requireVerifiedUser()
      return await handler(request, user)
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "UNAUTHORIZED") {
          return unauthorizedResponse("Authentication required")
        }
        if (error.message === "EMAIL_NOT_VERIFIED") {
          return forbiddenResponse("Email verification required")
        }
      }
      throw error
    }
  }
}

export function withAdminAuth(handler: (request: NextRequest, user: AuthUser) => Promise<Response>) {
  return async (request: NextRequest) => {
    try {
      const user = await requireAdmin()
      return await handler(request, user)
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "UNAUTHORIZED") {
          return unauthorizedResponse("Authentication required")
        }
        if (error.message === "FORBIDDEN") {
          return forbiddenResponse("Admin access required")
        }
      }
      throw error
    }
  }
}

// Check if user owns a resource
export async function requireOwnership(userId: string, resourceOwnerId: string): Promise<void> {
  const user = await requireAuth()
  if (user.id !== userId && user.id !== resourceOwnerId && user.role !== "ADMIN") {
    throw new Error("FORBIDDEN")
  }
}

// Check if user can access a transaction (buyer, seller, or admin)
export async function requireTransactionAccess(buyerId: string, sellerId: string): Promise<AuthUser> {
  const user = await requireAuth()
  if (user.id !== buyerId && user.id !== sellerId && user.role !== "ADMIN") {
    throw new Error("FORBIDDEN")
  }
  return user
}

// Validate that buyer is not the seller
export function validateBuyerNotSeller(buyerId: string, sellerId: string): void {
  if (buyerId === sellerId) {
    throw new Error("CANNOT_BUY_OWN_LISTING")
  }
}