import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { EventsFilter } from "./events-filter"

export default async function EventsPage({
  searchParams
}: {
  searchParams: { status?: string; hostType?: string; search?: string }
}) {
  const { status, hostType, search } = searchParams
  
  // Build where clause
  const where: any = { 
    isActive: true,
    startTime: { gte: new Date() }
  }
  
  if (status && status !== 'all') {
    where.status = status
  }
  
  if (hostType && hostType !== 'all') {
    where.hostType = hostType
  }
  
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { venue: { contains: search, mode: 'insensitive' } },
      { hostName: { contains: search, mode: 'insensitive' } }
    ]
  }

  const events = await (prisma as any).event.findMany({
    where,
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
          username: true
        }
      }
    },
    orderBy: { startTime: "asc" },
    take: 50
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "UPCOMING": return "default"
      case "ONGOING": return "success"
      case "COMPLETED": return "secondary"
      case "CANCELLED": return "destructive"
      case "RESCHEDULED": return "warning"
      default: return "default"
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <main className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">Campus Events</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
            {events.length} upcoming event{events.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/events/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto text-xs sm:text-sm">
            ✨ Create Event
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <EventsFilter 
        initialSearch={search}
        initialStatus={status}
        initialHostType={hostType}
      />

      {events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold mb-2">No Upcoming Events</h3>
            <p className="text-muted-foreground mb-6">Be the first to create an event!</p>
            <Link href="/events/new">
              <Button>Create Event</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {events.map((event: any) => (
            <Link key={event.id} href={`/events/${event.id}`}>
              <Card className="h-full hover:border-primary/50 cursor-pointer overflow-hidden">
                {event.imageUrl ? (
                  <div className="relative w-full h-32 sm:h-40 lg:h-48 overflow-hidden">
                    {/* Blurred background */}
                    <Image
                      src={event.imageUrl}
                      alt=""
                      fill
                      className="object-cover blur-xl scale-110 opacity-50"
                    />
                    {/* Main image */}
                    <div className="absolute inset-0 flex items-center justify-center p-2">
                      <Image
                        src={event.imageUrl}
                        alt={event.title}
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-32 sm:h-40 lg:h-48 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <span className="text-4xl opacity-30">📅</span>
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <CardTitle className="line-clamp-2">{event.title}</CardTitle>
                    <Badge variant={getStatusColor(event.status) as any} className="text-xs shrink-0">
                      {event.status}
                    </Badge>
                  </div>
                  <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span>📅</span>
                      <span className="truncate">{formatDate(event.startTime)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>🕐</span>
                      <span className="truncate">{formatTime(event.startTime)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>📍</span>
                      <span className="line-clamp-1">{event.venue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>🎯</span>
                      <span className="line-clamp-1">{event.hostName}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 sm:line-clamp-3">
                    {event.description}
                  </p>
                  <div className="mt-3 sm:mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="truncate">By {event.creator.username || event.creator.name || event.creator.email?.split('@')[0]}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
