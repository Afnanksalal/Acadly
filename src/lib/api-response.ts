import { NextResponse } from "next/server"
import { formatErrorResponse } from "./validation"

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any[]
  }
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export function successResponse<T>(
  data: T,
  status: number = 200,
  pagination?: ApiResponse["pagination"]
): NextResponse {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(pagination && { pagination }),
  }
  
  return NextResponse.json(response, { status })
}

export function errorResponse(
  error: unknown,
  status: number = 500
): NextResponse {
  const formattedError = formatErrorResponse(error)
  
  const response: ApiResponse = {
    success: false,
    ...formattedError,
  }
  
  return NextResponse.json(response, { status })
}

export function validationErrorResponse(message: string, details?: any[]): NextResponse {
  const response: ApiResponse = {
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      message,
      details,
    },
  }
  
  return NextResponse.json(response, { status: 400 })
}

export function unauthorizedResponse(message: string = "Unauthorized"): NextResponse {
  const response: ApiResponse = {
    success: false,
    error: {
      code: "UNAUTHORIZED",
      message,
    },
  }
  
  return NextResponse.json(response, { status: 401 })
}

export function forbiddenResponse(message: string = "Forbidden"): NextResponse {
  const response: ApiResponse = {
    success: false,
    error: {
      code: "FORBIDDEN",
      message,
    },
  }
  
  return NextResponse.json(response, { status: 403 })
}

export function notFoundResponse(message: string = "Resource not found"): NextResponse {
  const response: ApiResponse = {
    success: false,
    error: {
      code: "NOT_FOUND",
      message,
    },
  }
  
  return NextResponse.json(response, { status: 404 })
}

export function conflictResponse(message: string = "Resource already exists"): NextResponse {
  const response: ApiResponse = {
    success: false,
    error: {
      code: "CONFLICT",
      message,
    },
  }
  
  return NextResponse.json(response, { status: 409 })
}

export function tooManyRequestsResponse(message: string = "Too many requests"): NextResponse {
  const response: ApiResponse = {
    success: false,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message,
    },
  }
  
  return NextResponse.json(response, { status: 429 })
}