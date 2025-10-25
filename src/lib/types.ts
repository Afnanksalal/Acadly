import { Prisma } from "@prisma/client"

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
