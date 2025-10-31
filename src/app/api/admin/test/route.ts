import { NextRequest } from "next/server"
import { withAdminAuth } from "@/lib/auth"
import { successResponse } from "@/lib/api-response"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async (request: NextRequest, user) => {
  return successResponse({
    message: "Admin dashboard APIs are working!",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    timestamp: new Date(),
    availableEndpoints: [
      "/api/admin/dashboard/summary",
      "/api/admin/dashboard/realtime", 
      "/api/admin/system/monitor",
      "/api/admin/users/advanced",
      "/api/admin/content/moderation",
      "/api/admin/financial/overview",
      "/api/admin/settings/advanced",
      "/api/admin/system/backup"
    ]
  })
})