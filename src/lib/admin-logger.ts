import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"

export interface AdminLogData {
  adminId: string
  action: string
  targetType?: string
  targetId?: string
  details?: Record<string, any>
  request?: NextRequest
}

export async function logAdminAction(data: AdminLogData) {
  try {
    // Use AuditLog model (note the capital A) since it exists in the schema
    await prisma.auditLog.create({
      data: {
        userId: data.adminId,
        action: data.action,
        resource: data.targetType || 'UNKNOWN',
        resourceId: data.targetId,
        newValues: data.details,
        ipAddress: data.request?.headers.get('x-forwarded-for') || 
                  data.request?.headers.get('x-real-ip') || 
                  'unknown',
        userAgent: data.request?.headers.get('user-agent') || 'unknown'
      }
    })
    
    console.log(`Admin Action: ${data.action} by ${data.adminId}`, {
      targetType: data.targetType,
      targetId: data.targetId,
      details: data.details
    })
  } catch (error) {
    console.error("Failed to log admin action:", error)
    // Fallback to console logging if database logging fails
    console.log(`Admin Action (fallback): ${data.action} by ${data.adminId}`, {
      targetType: data.targetType,
      targetId: data.targetId,
      details: data.details,
      timestamp: new Date().toISOString()
    })
  }
}

// Common admin actions
export const ADMIN_ACTIONS = {
  // User management
  DISABLE_USER: "DISABLE_USER",
  ENABLE_USER: "ENABLE_USER", 
  UPDATE_USER: "UPDATE_USER",
  DELETE_USER: "DELETE_USER",
  VERIFY_USER: "VERIFY_USER",
  
  // Listing management
  APPROVE_LISTING: "APPROVE_LISTING",
  REJECT_LISTING: "REJECT_LISTING",
  DELETE_LISTING: "DELETE_LISTING",
  
  // Dispute management
  RESOLVE_DISPUTE: "RESOLVE_DISPUTE",
  REJECT_DISPUTE: "REJECT_DISPUTE",
  UPDATE_DISPUTE: "UPDATE_DISPUTE",
  
  // Transaction management
  REFUND_TRANSACTION: "REFUND_TRANSACTION",
  CANCEL_TRANSACTION: "CANCEL_TRANSACTION",
  
  // System management
  UPDATE_SETTINGS: "UPDATE_SETTINGS",
  BULK_ACTION: "BULK_ACTION",
  
  // Access logs
  VIEW_DASHBOARD: "VIEW_DASHBOARD",
  VIEW_USERS: "VIEW_USERS",
  VIEW_DISPUTES: "VIEW_DISPUTES",
  VIEW_ANALYTICS: "VIEW_ANALYTICS",
  VIEW_LOGS: "VIEW_LOGS",
} as const