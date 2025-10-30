import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { ZodError } from "zod"

export interface AppError extends Error {
  code?: string
  statusCode?: number
  details?: any
}

export class ValidationError extends Error {
  constructor(message: string, public details?: any) {
    super(message)
    this.name = "ValidationError"
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = "Authentication required") {
    super(message)
    this.name = "AuthenticationError"
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = "Insufficient permissions") {
    super(message)
    this.name = "AuthorizationError"
  }
}

export class NotFoundError extends Error {
  constructor(message: string = "Resource not found") {
    super(message)
    this.name = "NotFoundError"
  }
}

export class ConflictError extends Error {
  constructor(message: string = "Resource already exists") {
    super(message)
    this.name = "ConflictError"
  }
}

export function handleApiError(error: unknown): NextResponse {
  console.error("API Error:", error)

  // Zod validation errors
  if (error instanceof ZodError) {
    const fieldErrors = error.errors.map(e => ({
      field: e.path.join("."),
      message: e.message,
    }))
    
    // Create a user-friendly message
    const mainMessage = fieldErrors.length === 1 
      ? fieldErrors[0].message
      : `Please fix the following errors: ${fieldErrors.map(e => e.message).join(", ")}`

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: mainMessage,
          details: fieldErrors,
        },
      },
      { status: 400 }
    )
  }

  // Custom application errors
  if (error instanceof ValidationError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error.message,
          details: error.details,
        },
      },
      { status: 400 }
    )
  }

  if (error instanceof AuthenticationError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "AUTHENTICATION_ERROR",
          message: error.message,
        },
      },
      { status: 401 }
    )
  }

  if (error instanceof AuthorizationError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "AUTHORIZATION_ERROR",
          message: error.message,
        },
      },
      { status: 403 }
    )
  }

  if (error instanceof NotFoundError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: error.message,
        },
      },
      { status: 404 }
    )
  }

  if (error instanceof ConflictError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "CONFLICT",
          message: error.message,
        },
      },
      { status: 409 }
    )
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "DUPLICATE_ENTRY",
              message: "A record with this information already exists",
              field: error.meta?.target,
            },
          },
          { status: 409 }
        )
      case "P2025":
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "NOT_FOUND",
              message: "The requested record was not found",
            },
          },
          { status: 404 }
        )
      case "P2003":
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "FOREIGN_KEY_CONSTRAINT",
              message: "This operation violates a data relationship constraint",
            },
          },
          { status: 400 }
        )
      default:
        console.error("Unhandled Prisma error:", error)
        break
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "DATABASE_VALIDATION_ERROR",
          message: "Invalid data provided to database",
        },
      },
      { status: 400 }
    )
  }

  // Network/timeout errors
  if (error instanceof Error && error.message.includes("timeout")) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "TIMEOUT_ERROR",
          message: "Request timed out. Please try again.",
        },
      },
      { status: 408 }
    )
  }

  // Generic error handling
  if (error instanceof Error) {
    // Don't expose internal errors in production
    const message = process.env.NODE_ENV === "production" 
      ? "An internal server error occurred"
      : error.message

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message,
        },
      },
      { status: 500 }
    )
  }

  // Unknown error
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "UNKNOWN_ERROR",
        message: "An unknown error occurred",
      },
    },
    { status: 500 }
  )
}

// Async error wrapper for API routes
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      return handleApiError(error)
    }
  }
}