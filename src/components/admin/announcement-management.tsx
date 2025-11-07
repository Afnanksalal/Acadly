'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { 
  Megaphone, 
  Plus, 
  Eye, 
  EyeOff,
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Announcement {
  id: string
  title: string
  content: string
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR' | 'MAINTENANCE' | 'FEATURE' | 'PROMOTION'
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  isActive: boolean
  startDate: string | null
  endDate: string | null
  createdAt: string
  _count?: {
    views: number
  }
}

export function AnnouncementManagement() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'INFO' as const,
    priority: 'NORMAL' as const,
    startDate: '',
    endDate: '',
    targetAudience: '[]'
  })

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/announcements?limit=50')
      if (response.ok) {
        const data = await response.json()
        setAnnouncements(data.data?.announcements || [])
      }
    } catch (error) {
      console.error('Failed to fetch announcements:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          startDate: formData.startDate || undefined,
          endDate: formData.endDate || undefined,
          targetAudience: formData.targetAudience ? JSON.parse(formData.targetAudience) : undefined
        })
      })

      if (response.ok) {
        setDialogOpen(false)
        setFormData({
          title: '',
          content: '',
          type: 'INFO',
          priority: 'NORMAL',
          startDate: '',
          endDate: '',
          targetAudience: '[]'
        })
        fetchAnnouncements()
      } else {
        const data = await response.json()
        setError(data.error?.message || 'Failed to create announcement')
      }
    } catch (error) {
      setError('Failed to create announcement')
    } finally {
      setSubmitting(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4" />
      case 'SUCCESS':
        return <CheckCircle className="h-4 w-4" />
      case 'ERROR':
        return <AlertCircle className="h-4 w-4" />
      case 'MAINTENANCE':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'SUCCESS':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'ERROR':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'MAINTENANCE':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'FEATURE':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'PROMOTION':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'NORMAL':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold">Announcements</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Announcement</DialogTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Create a system-wide announcement that will be shown to users and sent as notifications
              </p>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Important Update"
                  required
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Announcement details..."
                  rows={4}
                  required
                  maxLength={5000}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.content.length}/5000 characters
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  >
                    <option value="INFO">Info</option>
                    <option value="WARNING">Warning</option>
                    <option value="SUCCESS">Success</option>
                    <option value="ERROR">Error</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="FEATURE">Feature</option>
                    <option value="PROMOTION">Promotion</option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    id="priority"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date (Optional)</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date (Optional)</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded text-sm">
                <p className="text-blue-600 dark:text-blue-400">
                  <Info className="h-4 w-4 inline mr-1" />
                  This announcement will be shown as a banner and sent as a notification to all users.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? 'Creating...' : 'Create Announcement'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Announcements List */}
      <Card className="hover-lift">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle>All Announcements</CardTitle>
          <CardDescription>Manage system-wide announcements and notifications</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="space-y-3 sm:space-y-4">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center p-3 sm:p-4 border border-primary/10 rounded-lg bg-muted/20 animate-pulse">
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-48 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-64"></div>
                  </div>
                </div>
              ))
            ) : announcements.length === 0 ? (
              <div className="text-center py-8">
                <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-lg font-medium mb-2">No announcements yet</p>
                <p className="text-sm text-muted-foreground">
                  Create your first announcement to notify users
                </p>
              </div>
            ) : (
              announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border border-primary/10 rounded-lg bg-muted/20 gap-3"
                >
                  <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                      {getTypeIcon(announcement.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm sm:text-base line-clamp-1">
                          {announcement.title}
                        </h4>
                        <Badge className={getTypeColor(announcement.type)}>
                          {announcement.type}
                        </Badge>
                        <Badge className={getPriorityColor(announcement.priority)}>
                          {announcement.priority}
                        </Badge>
                        <Badge variant={announcement.isActive ? 'default' : 'secondary'}>
                          {announcement.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-1">
                        {announcement.content}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{announcement._count?.views || 0} views</span>
                        <span>•</span>
                        <span>Created {new Date(announcement.createdAt).toLocaleDateString()}</span>
                        {announcement.startDate && (
                          <>
                            <span>•</span>
                            <span>Starts {new Date(announcement.startDate).toLocaleDateString()}</span>
                          </>
                        )}
                        {announcement.endDate && (
                          <>
                            <span>•</span>
                            <span>Ends {new Date(announcement.endDate).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
