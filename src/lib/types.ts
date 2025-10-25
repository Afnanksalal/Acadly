import { Prisma, DisputeReason, DisputeStatus } from "@prisma/client"

// Profile Types
export type ProfileWithStats = Prisma.ProfileGetPayload<{
  include: {
    reviewsReceived: {
      include: {
        reviewer: {
          select: {
            id: true
            username: true
            email: true
            avatarUrl: true
          }
        }
      }
    }
    _count: {
      select: {
        listings: true
        purchases: true
        sales: true
      }
    }
  }
}>

export type PublicProfile = {
  id: string
  username: string | null
  name: string | null
  avatarUrl: string | null
  bio: string | null
  department: string | null
  year: string | null
  ratingAvg: number
  ratingCount: number
  createdAt: Date
  listingsCount: number
  salesCount: number
}

export type ProfileUpdateData = {
  name?: string
  username?: string
  phone?: string
  department?: string
  year?: string
  class?: string
  bio?: string
  avatarUrl?: string
}

// Admin Dashboard Types
export type PendingUser = Prisma.ProfileGetPayload<{
  select: {
    id: true
    email: true
    createdAt: true
  }
}>

export type DisputeWithRelations = Prisma.DisputeGetPayload<{
  include: {
    transaction: {
      include: {
        buyer: true
        seller: true
        listing: true
      }
    }
    reporter: true
    actions: {
      include: {
        admin: true
      }
    }
  }
}>

export type RecentListing = Prisma.ListingGetPayload<{
  include: {
    category: true
    user: true
  }
}>

// Serialized version for client components (Decimal -> string)
export type SerializedRecentListing = Omit<RecentListing, 'price'> & {
  price: string
}

// Chat Types
export type ChatWithRelations = Prisma.ChatGetPayload<{
  include: {
    listing: true
    buyer: true
    seller: true
    messages: true
  }
}>

// Transaction Types
export type TransactionWithRelations = Prisma.TransactionGetPayload<{
  include: {
    buyer: true
    seller: true
    listing: true
    pickup: true
    reviews: true
  }
}>

// Listing Types
export type ListingWithRelations = Prisma.ListingGetPayload<{
  include: {
    category: true
    user: true
  }
}>

export type ListingWithCategory = Prisma.ListingGetPayload<{
  include: {
    category: true
  }
}>

// Review Types
export type ReviewWithRelations = Prisma.ReviewGetPayload<{
  include: {
    reviewer: {
      select: {
        id: true
        username: true
        email: true
        avatarUrl: true
      }
    }
    reviewee: {
      select: {
        id: true
        username: true
        email: true
      }
    }
    transaction: {
      include: {
        listing: {
          select: {
            id: true
            title: true
          }
        }
      }
    }
  }
}>

export type CreateReviewData = {
  transactionId: string
  revieweeId: string
  rating: number
  comment?: string
}

// Dispute Types
export type CreateDisputeData = {
  transactionId: string
  subject: string
  description: string
  reason: DisputeReason
  evidence?: string[]
}

export type ResolveDisputeData = {
  disputeId: string
  resolution: string
  status: DisputeStatus
  refundAmount?: number
}

// API Response Types
export type ApiResponse<T> = {
  data?: T
  error?: {
    code: string
    message: string
  }
}

export type ApiError = {
  code: string
  message: string
  details?: unknown
}
