"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { apiRequest } from "@/lib/api-client"
import { Users, Calendar } from "lucide-react"

type ClubMembership = {
  id: string
  role: string
  position: string | null
  joinedAt: string
  leftAt: string | null
  isActive: boolean
  club: {
    id: string
    name: string
    description: string | null
    category: string
    logoUrl: string | null
    isActive: boolean
  }
}

const ROLE_COLORS: Record<string, string> = {
  PRESIDENT: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  VICE_PRESIDENT: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  SECRETARY: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  TREASURER: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  COORDINATOR: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  ADVISOR: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  MEMBER: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
}

export function ClubSection({ userId }: { userId: string }) {
  const [memberships, setMemberships] = useState<ClubMembership[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMemberships()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  async function fetchMemberships() {
    try {
      const data = await apiRequest(`/api/clubs?userId=${userId}`)
      setMemberships(data.memberships || [])
    } catch (error) {
      console.error("Failed to fetch club memberships:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading clubs...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Club Memberships ({memberships.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {memberships.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Not a member of any clubs yet</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {memberships.map((membership) => (
              <div
                key={membership.id}
                className="border border-border rounded-lg p-3 hover:border-primary transition-colors"
              >
                <div className="flex items-start gap-3">
                  {membership.club.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={membership.club.logoUrl}
                      alt={membership.club.name}
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-secondary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-1 line-clamp-1">{membership.club.name}</h3>
                    <div className="flex flex-wrap gap-1 mb-2">
                      <Badge className={`text-xs ${ROLE_COLORS[membership.role] || ROLE_COLORS.MEMBER}`}>
                        {membership.role.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {membership.club.category}
                      </Badge>
                    </div>
                    {membership.position && (
                      <p className="text-xs text-muted-foreground mb-1 line-clamp-1">{membership.position}</p>
                    )}
                    {membership.club.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                        {membership.club.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {new Date(membership.joinedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
