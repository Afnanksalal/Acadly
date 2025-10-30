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
export const emailSchema = z.string().email("Please enter a valid email address")
export const phoneSchema = z.string().regex(/^\+?[\d\s\-\(\)]{10,}$/, "Please enter a valid phone number")
export const uuidSchema = z.string().uuid("Invalid selection")
export const priceSchema = z.number().positive("Price must be greater than 0").max(999999, "Price cannot exceed ₹999,999")

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
  // Fast path for simple strings that don't need escaping
  if (!/[<>&"']/.test(input)) {
    return input.trim()
  }
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
    // Optimized validation for better performance
    if (typeof body === "object" && body !== null) {
      const sanitized = Object.entries(body).reduce((acc, [key, value]) => {
        if (typeof value === "string" && value.length > 0) {
          // Only sanitize non-empty strings to reduce processing
          acc[key] = sanitizeInputSync(value)
        } else {
          acc[key] = value
        }
        return acc
      }, {} as any)

      // Use safeParse for better performance
      const result = schema.safeParse(sanitized)
      if (!result.success) {
        throw result.error
      }
      return result.data
    }

    const result = schema.safeParse(body)
    if (!result.success) {
      throw result.error
    }
    return result.data
  }
}

// Error response formatter
export function formatErrorResponse(error: unknown) {
  if (error instanceof z.ZodError) {
    // Create a user-friendly message from validation errors
    const fieldErrors = error.errors.map(e => ({
      field: e.path.join("."),
      message: e.message,
    }))

    // Create a summary message for the main error
    const mainMessage = fieldErrors.length === 1
      ? fieldErrors[0].message
      : `Please fix the following errors: ${fieldErrors.map(e => e.message).join(", ")}`

    return {
      error: {
        code: "VALIDATION_ERROR",
        message: mainMessage,
        details: fieldErrors,
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
  listingId: z.string().uuid("Invalid listing selected"),
  amount: z.union([
    z.number().positive("Amount must be greater than 0"),
    z.string().transform((val) => {
      const num = parseFloat(val)
      if (isNaN(num) || num <= 0) {
        throw new Error("Please enter a valid amount greater than 0")
      }
      return num
    })
  ]),
})

export const createListingSchema = z.object({
  title: z.string().min(1, "Please enter a title for your listing").max(200, "Title must be less than 200 characters"),
  description: z.string().min(1, "Please provide a description").max(2000, "Description must be less than 2000 characters"),
  price: z.union([
    z.number().positive("Price must be greater than 0").max(999999, "Price cannot exceed ₹999,999"),
    z.string().transform((val) => {
      const num = parseFloat(val)
      if (isNaN(num) || num <= 0) {
        throw new Error("Please enter a valid price greater than 0")
      }
      if (num > 999999) {
        throw new Error("Price cannot exceed ₹999,999")
      }
      return num
    })
  ]),
  categoryId: z.string().uuid("Please select a valid category"),
  images: z.array(z.string().url("Please provide valid image URLs")).min(1, "Please upload at least one image"),
  type: z.enum(["PRODUCT", "SERVICE"], { errorMap: () => ({ message: "Please select either Product or Service" }) }),
})

export const createChatSchema = z.object({
  listingId: uuidSchema,
})

export const sendMessageSchema = z.object({
  chatId: z.string().uuid("Invalid chat"),
  text: z.string().min(1, "Please enter a message").max(1000, "Message must be less than 1000 characters"),
})

export const createOfferSchema = z.object({
  chatId: z.string().uuid("Invalid chat"),
  price: z.union([
    z.number().positive("Offer price must be greater than 0").max(999999, "Offer price cannot exceed ₹999,999"),
    z.string().transform((val) => {
      const num = parseFloat(val)
      if (isNaN(num) || num <= 0) {
        throw new Error("Please enter a valid offer price greater than 0")
      }
      if (num > 999999) {
        throw new Error("Offer price cannot exceed ₹999,999")
      }
      return num
    })
  ]),
})

export const createReviewSchema = z.object({
  transactionId: z.string().uuid("Invalid transaction"),
  rating: z.union([
    z.number().int().min(1, "Please select a rating from 1 to 5 stars").max(5, "Rating cannot exceed 5 stars"),
    z.string().transform((val) => {
      const num = parseInt(val)
      if (isNaN(num) || num < 1 || num > 5) {
        throw new Error("Please select a rating from 1 to 5 stars")
      }
      return num
    })
  ]),
  comment: z.string().max(500, "Comment must be less than 500 characters").optional(),
})

export const createDisputeSchema = z.object({
  transactionId: z.string().uuid("Invalid transaction"),
  subject: z.string().min(1, "Please enter a subject for your dispute").max(200, "Subject must be less than 200 characters"),
  description: z.string().min(1, "Please describe the issue").max(2000, "Description must be less than 2000 characters"),
  reason: z.enum([
    "NOT_AS_DESCRIBED",
    "NOT_RECEIVED",
    "DAMAGED",
    "FAKE",
    "SELLER_UNRESPONSIVE",
    "BUYER_UNRESPONSIVE",
    "PAYMENT_ISSUE",
    "OTHER"
  ], { errorMap: () => ({ message: "Please select a reason for the dispute" }) }),
  evidence: z.array(z.string().url("Please provide valid evidence URLs")).optional(),
})

export const updateProfileSchema = z.object({
  name: z.string().min(1, "Please enter your name").max(100, "Name must be less than 100 characters").optional(),
  username: z.string().min(3, "Username must be at least 3 characters").max(30, "Username must be less than 30 characters").optional(),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]{10,}$/, "Please enter a valid phone number").optional(),
  department: z.string().max(100, "Department name must be less than 100 characters").optional(),
  year: z.string().max(20, "Year must be less than 20 characters").optional(),
  class: z.string().max(50, "Class must be less than 50 characters").optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  avatarUrl: z.string().url("Please provide a valid avatar URL").optional(),
})

export const createEventSchema = z.object({
  title: z.string().min(1, "Please enter an event title").max(200, "Title must be less than 200 characters"),
  description: z.string().min(1, "Please provide an event description").max(2000, "Description must be less than 2000 characters"),
  venue: z.string().min(1, "Please specify the event venue").max(200, "Venue must be less than 200 characters"),
  hostType: z.enum(["CLUB", "DEPARTMENT", "STUDENT_GROUP", "COLLEGE", "OTHER"], {
    errorMap: () => ({ message: "Please select a host type" })
  }),
  hostName: z.string().min(1, "Please enter the host name").max(100, "Host name must be less than 100 characters"),
  startTime: z.union([
    z.string().datetime("Please provide a valid start date and time"),
    z.date().transform((date) => date.toISOString())
  ]),
  endTime: z.union([
    z.string().datetime("Please provide a valid end date and time"),
    z.date().transform((date) => date.toISOString())
  ]).optional(),
  imageUrl: z.string().url("Please provide a valid image URL").optional(),
})