'use client'

import { useState, useEffect } from 'react'
import { X, AlertCircle, Info, CheckCircle, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Announcement {
  id: string
  title: string
  content: string
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR' | 'MAINTENANCE' | 'FEATURE' | 'PROMOTION'
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  isActive: boolean
  startDate?: string
  endDate?: string
}

export function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [dismissedIds, setDismissedIds] = useState<string[]>([])

  useEffect(() => {
    fetchAnnouncements()
    // Load dismissed announcements from localStorage
    const dismissed = localStorage.getItem('dismissedAnnouncements')
    if (dismissed) {
      try {
        setDismissedIds(JSON.parse(dismissed))
      } catch (error) {
        console.error('Failed to parse dismissed announcements:', error)
        localStorage.removeItem('dismissedAnnouncements')
      }
    }
  }, [])

  const fetchAnnouncements = async () => {
    try {
      // Add cache control and timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
      
      const response = await fetch('/api/announcements?priority=HIGH,URGENT&limit=3', {
        signal: controller.signal,
        cache: 'no-store', // Ensure fresh data for announcements
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setAnnouncements(data.data.announcements || [])
        }
      } else {
        console.warn('Failed to fetch announcements:', response.status)
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('Announcement fetch timed out')
      } else {
        console.error('Failed to fetch announcements:', error)
      }
      // Gracefully handle errors - don't show error to user
    }
  }

  const dismissAnnouncement = (id: string) => {
    const newDismissed = [...dismissedIds, id]
    setDismissedIds(newDismissed)
    
    try {
      localStorage.setItem('dismissedAnnouncements', JSON.stringify(newDismissed))
    } catch (error) {
      console.error('Failed to save dismissed announcements:', error)
    }
    
    // Mark as viewed (with timeout and error handling)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout
    
    fetch('/api/announcements', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ announcementId: id }),
      signal: controller.signal
    })
    .then(() => clearTimeout(timeoutId))
    .catch(error => {
      clearTimeout(timeoutId)
      if (error.name !== 'AbortError') {
        console.error('Failed to mark announcement as viewed:', error)
      }
    })
  }

  const getAnnouncementStyle = (type: string, priority: string) => {
    const baseClasses = "border-l-4 px-4 py-3"
    
    if (priority === 'URGENT') {
      return `${baseClasses} bg-red-500/10 border-red-500 text-red-400`
    }
    
    switch (type) {
      case 'WARNING':
        return `${baseClasses} bg-yellow-500/10 border-yellow-500 text-yellow-400`
      case 'SUCCESS':
        return `${baseClasses} bg-green-500/10 border-green-500 text-green-400`
      case 'ERROR':
        return `${baseClasses} bg-red-500/10 border-red-500 text-red-400`
      case 'MAINTENANCE':
        return `${baseClasses} bg-orange-500/10 border-orange-500 text-orange-400`
      case 'FEATURE':
        return `${baseClasses} bg-blue-500/10 border-blue-500 text-blue-400`
      case 'PROMOTION':
        return `${baseClasses} bg-primary/10 border-primary text-primary`
      default:
        return `${baseClasses} bg-blue-500/10 border-blue-500 text-blue-400`
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'WARNING':
        return <AlertTriangle className="h-5 w-5" />
      case 'SUCCESS':
        return <CheckCircle className="h-5 w-5" />
      case 'ERROR':
        return <AlertCircle className="h-5 w-5" />
      case 'MAINTENANCE':
        return <AlertTriangle className="h-5 w-5" />
      default:
        return <Info className="h-5 w-5" />
    }
  }

  // Filter active announcements that haven't been dismissed
  const activeAnnouncements = announcements.filter(announcement => {
    if (!announcement.isActive || dismissedIds.includes(announcement.id)) {
      return false
    }
    
    const now = new Date()
    const startDate = announcement.startDate ? new Date(announcement.startDate) : null
    const endDate = announcement.endDate ? new Date(announcement.endDate) : null
    
    if (startDate && now < startDate) return false
    if (endDate && now > endDate) return false
    
    return true
  })

  if (activeAnnouncements.length === 0) {
    return null
  }

  return (
    <div className="space-y-1">
      {activeAnnouncements.map((announcement) => (
        <div
          key={announcement.id}
          className={getAnnouncementStyle(announcement.type, announcement.priority)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getIcon(announcement.type)}
              <div>
                <h4 className="font-medium">{announcement.title}</h4>
                <p className="text-sm opacity-90">{announcement.content}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dismissAnnouncement(announcement.id)}
              className="text-current hover:bg-muted/50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}