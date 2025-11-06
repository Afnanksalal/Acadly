"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { apiRequest } from "@/lib/api-client"
import { Calendar, MapPin, Clock, Users } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

type Event = {
  id: string
  title: string
  description: string
  imageUrl: string | null
  venue: string
  hostType: string
  hostName: string
  startTime: string
  endTime: string | null
  status: string
  isActive: boolean
  createdAt: string
}

const STATUS_COLORS: Record<string, string> = {
  UPCOMING: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  ONGOING: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  COMPLETED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  RESCHEDULED: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
}

export function EventSection({ userId }: { userId: string }) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEvents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  async function fetchEvents() {
    try {
      const data = await apiRequest(`/api/events?creatorId=${userId}`)
      setEvents(data.events || [])
    } catch (error) {
      console.error("Failed to fetch events:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading events...</div>
  }

  if (events.length === 0) {
    return null // Don't show the section if there are no events
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Events Created ({events.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="block border border-border rounded-lg p-3 hover:border-primary transition-colors"
            >
              <div className="flex items-start gap-3">
                {event.imageUrl && (
                  <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden">
                    <Image
                      src={event.imageUrl}
                      alt={event.title}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold text-sm line-clamp-1">{event.title}</h3>
                    <Badge className={`text-xs ${STATUS_COLORS[event.status] || STATUS_COLORS.UPCOMING}`}>
                      {event.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {event.description}
                  </p>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Users className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{event.hostName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{event.venue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">
                        {new Date(event.startTime).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
