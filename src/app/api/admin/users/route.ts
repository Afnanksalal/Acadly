import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminAuth } from "@/lib/auth"
import { successResponse, errorResponse } from "@/lib/api-response"

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const status = searchParams.get('status') || ''
    
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (role && role !== 'all') {
      where.role = role
    }
    
    if (status === 'verified') {
      where.verified = true
    } else if (status === 'unverified') {
      where.verified = false
    }

    const [users, totalCount, verifiedCount, adminCount] = await Promise.all([
      prisma.profile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          verified: true,
          createdAt: true,
          _count: {
            select: {
              listings: true,
              purchases: true,
              sales: true
            }
          }
        }
      }),
      prisma.profile.count({ where }),
      prisma.profile.count({ where: { verified: true } }),
      prisma.profile.count({ where: { role: 'ADMIN' } })
    ])

    const usersWithStats = users.map(user => ({
      ...user,
      totalTransactions: user._count.purchases + user._count.sales,
      totalListings: user._count.listings
    }))

    // Calculate stats for the component
    const stats = {
      total: totalCount,
      verified: verifiedCount,
      unverified: totalCount - verifiedCount,
      admins: adminCount,
      users: totalCount - adminCount
    }

    return successResponse({
      users: usersWithStats,
      stats,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return errorResponse(error, 500)
  }
})