"use client"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { NativeSelect } from "@/components/ui/select"
import { createBrowserClient } from "@supabase/ssr"
import { apiRequest, getErrorMessage } from "@/lib/api-client"
import Image from "next/image"
import { Video, MapPin, Link as LinkIcon } from "lucide-react"

export default function NewEventPage() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imageUrl: "",
    venue: "",
    hostType: "CLUB" as "CLUB" | "DEPARTMENT" | "STUDENT_GROUP" | "COLLEGE" | "OTHER",
    hostName: "",
    startTime: "",
    endTime: "",
    eventMode: "OFFLINE" as "ONLINE" | "OFFLINE" | "HYBRID",
    meetLink: "",
    registrationUrl: ""
  })

  useEffect(() => {
    // Check auth and verification
    supabase.auth.getUser().then(async (res) => {
      if (!res.data.user) {
        router.push('/auth/login?redirect=/events/new')
        return
      }
      
      const profileRes = await fetch('/api/profile')
      if (profileRes.ok) {
        const response = await profileRes.json()
        const profile = response.data?.profile || response.profile
        if (!profile.verified) {
          setError('Please verify your account to create events')
        }
      }
    })
  }, [router, supabase.auth])

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError("")
    
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be less than 2MB')
      return
    }

    setUploading(true)

    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `event-${Date.now()}.${fileExt}`
      const filePath = fileName

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, { 
          cacheControl: '3600', 
          upsert: false,
          contentType: file.type
        })

      if (uploadError) {
        throw new Error(uploadError.message || 'Upload failed')
      }

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      setFormData(prev => ({ ...prev, imageUrl: publicUrl }))
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload image')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess(false)
    setLoading(true)

    try {
      if (!formData.title || !formData.description || !formData.venue || !formData.hostName || !formData.startTime) {
        throw new Error('Please fill in all required fields')
      }

      const payload = {
        title: formData.title,
        description: formData.description,
        imageUrl: formData.imageUrl || null,
        venue: formData.venue,
        hostType: formData.hostType,
        hostName: formData.hostName,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: formData.endTime ? new Date(formData.endTime).toISOString() : null,
        eventMode: formData.eventMode,
        meetLink: formData.meetLink || null,
        registrationUrl: formData.registrationUrl || null
      }

      const data = await apiRequest("/api/events", {
        method: "POST",
        body: JSON.stringify(payload)
      })

      setSuccess(true)
      setTimeout(() => {
        router.push(`/events/${data.event.id}`)
      }, 1500)
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create New Event</CardTitle>
          <p className="text-sm text-muted-foreground">Share an upcoming event with the campus community</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                <AlertDescription className="text-green-700 dark:text-green-400">
                  Event created successfully! Redirecting...
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Annual Tech Fest 2024"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your event in detail..."
                rows={6}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Event Image</Label>
              <div className="flex items-center gap-4">
                {formData.imageUrl && (
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
                    <Image
                      src={formData.imageUrl}
                      alt="Event"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? "Uploading..." : formData.imageUrl ? "Change Image" : "Upload Image"}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">Max 2MB. JPG, PNG, or GIF.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="venue">Venue *</Label>
                <Input
                  id="venue"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  placeholder="Main Auditorium"
                  required
                />
              </div>

              <div className="space-y-2">
                <NativeSelect
                  id="hostType"
                  label="Host Type *"
                  value={formData.hostType}
                  onChange={(e) => setFormData({ ...formData, hostType: e.target.value as typeof formData.hostType })}
                  required
                >
                  <option value="CLUB">Club</option>
                  <option value="DEPARTMENT">Department</option>
                  <option value="STUDENT_GROUP">Student Group</option>
                  <option value="COLLEGE">College</option>
                  <option value="OTHER">Other</option>
                </NativeSelect>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hostName">Host Name *</Label>
                <Input
                  id="hostName"
                  value={formData.hostName}
                  onChange={(e) => setFormData({ ...formData, hostName: e.target.value })}
                  placeholder="Tech Club / CS Department"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startTime">Start Date & Time *</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">End Date & Time (Optional)</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>

            {/* Event Mode Section */}
            <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border">
              <h3 className="font-semibold flex items-center gap-2">
                <Video className="h-4 w-4" />
                Event Mode
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <NativeSelect
                    id="eventMode"
                    label="Mode *"
                    value={formData.eventMode}
                    onChange={(e) => setFormData({ ...formData, eventMode: e.target.value as typeof formData.eventMode })}
                    required
                  >
                    <option value="OFFLINE">Offline (In-Person)</option>
                    <option value="ONLINE">Online (Virtual)</option>
                    <option value="HYBRID">Hybrid (Both)</option>
                  </NativeSelect>
                </div>

                {(formData.eventMode === "ONLINE" || formData.eventMode === "HYBRID") && (
                  <div className="space-y-2">
                    <Label htmlFor="meetLink">Meeting Link</Label>
                    <Input
                      id="meetLink"
                      type="url"
                      value={formData.meetLink}
                      onChange={(e) => setFormData({ ...formData, meetLink: e.target.value })}
                      placeholder="https://meet.google.com/xxx-xxxx-xxx"
                    />
                    <p className="text-xs text-muted-foreground">Google Meet, Zoom, Teams, etc.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Registration Section */}
            <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border">
              <h3 className="font-semibold flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Registration (Optional)
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="registrationUrl">Registration Form URL</Label>
                <Input
                  id="registrationUrl"
                  type="url"
                  value={formData.registrationUrl}
                  onChange={(e) => setFormData({ ...formData, registrationUrl: e.target.value })}
                  placeholder="https://forms.google.com/..."
                />
                <p className="text-xs text-muted-foreground">Google Forms, Typeform, or any registration link</p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading || uploading} className="flex-1">
                {loading ? "Creating..." : "Create Event"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
