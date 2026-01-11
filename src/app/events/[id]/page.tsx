import { prisma } from "@/lib/prisma"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { validateUUIDParam } from "@/lib/uuid-validation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { EventActions } from "./event-actions"
import { Metadata } from "next"
import { ExternalLink, Video, MapPin } from "lucide-react"

// Generate dynamic metadata for social sharing
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const validation = validateUUIDParam(params.id, "event")
  if (!validation.isValid) {
    return { title: "Event Not Found" }
  }

  const event = await (prisma as any).event.findUnique({
    where: { id: params.id },
    select: { title: true, description: true, imageUrl: true, venue: true, startTime: true }
  })

  if (!event) {
    return { title: "Event Not Found" }
  }

  const eventDate = new Date(event.startTime).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })

  return {
    title: event.title,
    description: `${event.description?.slice(0, 150)}... | ${eventDate} at ${event.venue}`,
    openGraph: {
      title: event.title,
      description: `${event.description?.slice(0, 150)}... | ${eventDate} at ${event.venue}`,
      images: event.imageUrl ? [{ url: event.imageUrl, width: 1200, height: 630, alt: event.title }] : [],
      type: "website",
    },
    twitter: {
      card: event.imageUrl ? "summary_large_image" : "summary",
      title: event.title,
      description: `${event.description?.slice(0, 150)}...`,
      images: event.imageUrl ? [event.imageUrl] : [],
    },
  }
}

function EventCoverImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative w-full overflow-hidden rounded-t-lg bg-muted">
      {/* Blurred background layer */}
      <div className="absolute inset-0">
        <Image
          src={src}
          alt=""
          fill
          className="object-cover blur-2xl scale-110 opacity-60"
          priority
        />
        <div className="absolute inset-0 bg-background/30" />
      </div>
      
      {/* Main image - contained to show full image */}
      <div className="relative w-full flex items-center justify-center py-4 min-h-[200px] max-h-[500px]">
        <Image
          src={src}
          alt={alt}
          width={800}
          height={500}
          className="relative z-10 max-w-full max-h-[480px] w-auto h-auto object-contain rounded-lg shadow-2xl"
          priority
        />
      </div>
    </div>
  )
}

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  // Validate UUID format first
  const validation = validateUUIDParam(params.id, "event")
  if (!validation.isValid) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-semibold mb-4">{validation.error}</h1>
          <Link href="/events" className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors">
            ← Back to Events
          </Link>
        </div>
      </main>
    )
  }

  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const event = await (prisma as any).event.findUnique({
    where: { id: params.id },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          avatarUrl: true
        }
      }
    }
  })

  if (!event) {
    notFound()
  }

  const isCreator = user?.id === event.creatorId

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
      weekday: 'long',
      month: 'long',
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
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/events">
          <Button variant="outline">← Back to Events</Button>
        </Link>
      </div>

      <Card>
        {event.imageUrl && (
          <EventCoverImage src={event.imageUrl} alt={event.title} />
        )}
        
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <CardTitle className="text-3xl">{event.title}</CardTitle>
                <Badge variant={getStatusColor(event.status) as any} className="text-sm">
                  {event.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Created by {event.creator.username || event.creator.name || event.creator.email?.split('@')[0]}</span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Registration & Join Buttons */}
          {(event.registrationUrl || event.meetLink) && (
            <div className="flex flex-wrap gap-3">
              {event.registrationUrl && (
                <a
                  href={event.registrationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
                >
                  <ExternalLink className="h-4 w-4" />
                  Register Now
                </a>
              )}
              {event.meetLink && (event.eventMode === "ONLINE" || event.eventMode === "HYBRID") && (
                <a
                  href={event.meetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/90"
                >
                  <Video className="h-4 w-4" />
                  Join Online
                </a>
              )}
            </div>
          )}

          {/* Event Mode Badge */}
          {event.eventMode && (
            <div className="flex items-center gap-2">
              <Badge variant={event.eventMode === "ONLINE" ? "secondary" : event.eventMode === "HYBRID" ? "warning" : "outline"}>
                {event.eventMode === "ONLINE" && <Video className="h-3 w-3 mr-1" />}
                {event.eventMode === "OFFLINE" && <MapPin className="h-3 w-3 mr-1" />}
                {event.eventMode === "HYBRID" && "🌐 "}
                {event.eventMode}
              </Badge>
            </div>
          )}

          {/* Event Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📅</span>
                <div>
                  <p className="font-semibold">Date</p>
                  <p className="text-muted-foreground">{formatDate(event.startTime)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-2xl">🕐</span>
                <div>
                  <p className="font-semibold">Time</p>
                  <p className="text-muted-foreground">
                    {formatTime(event.startTime)}
                    {event.endTime && ` - ${formatTime(event.endTime)}`}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📍</span>
                <div>
                  <p className="font-semibold">Venue</p>
                  <p className="text-muted-foreground">{event.venue}</p>
                  {event.eventMode === "ONLINE" && (
                    <p className="text-xs text-muted-foreground">Virtual Event</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-2xl">🎯</span>
                <div>
                  <p className="font-semibold">Hosted By</p>
                  <p className="text-muted-foreground">{event.hostName}</p>
                  <p className="text-xs text-muted-foreground">{event.hostType.replace('_', ' ')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="pt-6 border-t border-border">
            <h3 className="font-semibold text-lg mb-3">About This Event</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
          </div>

          {/* Actions */}
          {isCreator && event.status !== "COMPLETED" && event.status !== "CANCELLED" && (
            <div className="pt-6 border-t border-border">
              <EventActions eventId={event.id} currentStatus={event.status} />
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
