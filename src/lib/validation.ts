import { z } from "zod"
import validator from "validator"

// Server-side HTML sanitization
let purify: any = null

// Initialize DOMPurify only when needed (server-side)
async function getPurify() {
  if (typeof window !== "undefined") {
    // Client-side
    const DOMPurify = await import("dompurify")
    return DOMPurify.default
  } else {
    // Server-side
    if (!purify) {
      const { JSDOM } = await import("jsdom")
      const DOMPurify = await import("dompurify")
      const window = new JSDOM("").window
      purify = DOMPurify.default(window)
    }
    return purify
  }
}

// Common validation schemas
export const emailSchema = z.string().email("Invalid email address")
export const phoneSchema = z.string().regex(/^\+?[\d\s\-\(\)]{10,}$/, "Invalid phone number")
export const uuidSchema = z.string().uuid("Invalid UUID")
export const priceSchema = z.number().positive("Price must be positive").max(999999, "Price too high")

// Sanitization functions
export async function sanitizeHtml(input: string): Promise<string> {
  try {
    const purifyInstance = await getPurify()
    return purifyInstance.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
  } catch (error) {
    console.error("HTML sanitization error:", error)
    // Fallback to basic escaping
    return validator.escape(input)
  }
}

export function sanitizeInput(input: string): string {
  return validator.escape(input.trim())
}

// Synchronous sanitization for simple cases
export function sanitizeInputSync(input: string): string {
  return validator.escape(input.trim())
}

export function validateEmail(email: string): boolean {
  return validator.isEmail(email)
}

export function validateUrl(url: string): boolean {
  return validator.isURL(url, {
    protocols: ["http", "https"],
    require_protocol: true,
  })
}

export function validateImageUrl(url: string): boolean {
  if (!validateUrl(url)) return false
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"]
  return imageExtensions.some(ext => url.toLowerCase().includes(ext))
}

// Input validation middleware
export function validateAndSanitizeBody<T>(schema: z.ZodSchema<T>) {
  return (body: unknown): T => {
    // First sanitize string fields
    if (typeof body === "object" && body !== null) {
      const sanitized = Object.entries(body).reduce((acc, [key, value]) => {
        if (typeof value === "string") {
          acc[key] = sanitizeInputSync(value)
        } else {
          acc[key] = value
        }
        return acc
      }, {} as any)
      
      // Then validate with schema
      return schema.parse(sanitized)
    }
    
    return schema.parse(body)
  }
}

// Error response formatter
export function formatErrorResponse(error: unknown) {
  if (error instanceof z.ZodError) {
    return {
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input data",
        details: error.errors.map(e => ({
          field: e.path.join("."),
          message: e.message,
        })),
      },
    }
  }

  if (error instanceof Error) {
    // Don't expose internal error details in production
    if (process.env.NODE_ENV === "production") {
      return {
        error: {
          code: "INTERNAL_ERROR",
          message: "An internal error occurred",
        },
      }
    }
    
    return {
      error: {
        code: "INTERNAL_ERROR",
        message: error.message,
      },
    }
  }

  return {
    error: {
      code: "UNKNOWN_ERROR",
      message: "An unknown error occurred",
    },
  }
}

// Pagination helpers
export interface PaginationParams {
  page?: number
  limit?: number
}

export function validatePagination(params: PaginationParams) {
  const page = Math.max(1, params.page || 1)
  const limit = Math.min(100, Math.max(1, params.limit || 20))
  const skip = (page - 1) * limit

  return { page, limit, skip }
}

// Transaction validation schemas
export const createTransactionSchema = z.object({
  listingId: uuidSchema,
  amount: priceSchema,
})

export const createListingSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().min(1, "Description is required").max(2000, "Description too long"),
  price: priceSchema,
  categoryId: uuidSchema,
  images: z.array(z.string().url("Invalid image URL")).min(1, "At least one image required"),
  type: z.enum(["PRODUCT", "SERVICE"]),
})

export const createChatSchema = z.object({
  listingId: uuidSchema,
})

export const sendMessageSchema = z.object({
  chatId: uuidSchema,
  text: z.string().min(1, "Message cannot be empty").max(1000, "Message too long"),
})

export const createOfferSchema = z.object({
  chatId: uuidSchema,
  price: priceSchema,
})

export const createReviewSchema = z.object({
  transactionId: uuidSchema,
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500, "Comment too long").optional(),
})

export const createDisputeSchema = z.object({
  transactionId: uuidSchema,
  subject: z.string().min(1, "Subject is required").max(200, "Subject too long"),
  description: z.string().min(1, "Description is required").max(2000, "Description too long"),
  reason: z.enum([
    "NOT_AS_DESCRIBED",
    "NOT_RECEIVED", 
    "DAMAGED",
    "FAKE",
    "SELLER_UNRESPONSIVE",
    "BUYER_UNRESPONSIVE",
    "PAYMENT_ISSUE",
    "OTHER"
  ]),
  evidence: z.array(z.string().url("Invalid evidence URL")).optional(),
})

export const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long").optional(),
  username: z.string().min(3, "Username too short").max(30, "Username too long").optional(),
  phone: phoneSchema.optional(),
  department: z.string().max(100, "Department name too long").optional(),
  year: z.string().max(20, "Year too long").optional(),
  class: z.string().max(50, "Class too long").optional(),
  bio: z.string().max(500, "Bio too long").optional(),
  avatarUrl: z.string().url("Invalid avatar URL").optional(),
})

export const createEventSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().min(1, "Description is required").max(2000, "Description too long"),
  venue: z.string().min(1, "Venue is required").max(200, "Venue too long"),
  hostType: z.enum(["CLUB", "DEPARTMENT", "STUDENT_GROUP", "COLLEGE", "OTHER"]),
  hostName: z.string().min(1, "Host name is required").max(100, "Host name too long"),
  startTime: z.string().datetime("Invalid start time"),
  endTime: z.string().datetime("Invalid end time").optional(),
  imageUrl: z.string().url("Invalid image URL").optional(),
})