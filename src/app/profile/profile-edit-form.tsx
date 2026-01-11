"use client"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createBrowserClient } from "@supabase/ssr"
import { apiRequest, getErrorMessage } from "@/lib/api-client"
import Image from "next/image"

type Profile = {
  id: string
  email: string
  name: string | null
  username: string | null
  phone: string | null
  department: string | null
  year: string | null
  class: string | null
  bio: string | null
  avatarUrl: string | null
}

export function ProfileEditForm({ profile }: { profile: Profile }) {
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
    name: profile.name || "",
    username: profile.username || "",
    phone: profile.phone || "",
    department: profile.department || "",
    year: profile.year || "",
    class: profile.class || "",
    bio: profile.bio || "",
    avatarUrl: profile.avatarUrl || ""
  })

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Clear previous errors
    setError("")
    setSuccess(false)

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPG, PNG, GIF, or WebP)')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be less than 2MB')
      return
    }

    setUploading(true)

    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`
      const filePath = fileName

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, { 
          cacheControl: '3600',
          upsert: false 
        })

      if (uploadError) {
        throw new Error(uploadError.message || 'Failed to upload image')
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      if (!publicUrl) {
        throw new Error('Failed to get image URL')
      }

      // Update form data
      setFormData(prev => ({ ...prev, avatarUrl: publicUrl }))
      
      // Show success message
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      
    } catch (err) {
      console.error('Image upload error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload image. Please try again.'
      setError(errorMessage)
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    // Clear previous messages
    setError("")
    setSuccess(false)
    setLoading(true)

    try {
      // Validate required fields
      if (!formData.name?.trim()) {
        throw new Error('Name is required')
      }

      if (formData.username && formData.username.length < 3) {
        throw new Error('Username must be at least 3 characters')
      }

      if (formData.phone && !/^[0-9]{10}$/.test(formData.phone)) {
        throw new Error('Phone number must be exactly 10 digits')
      }

      // Convert empty strings to null for optional fields
      const cleanedData = {
        name: formData.name.trim() || undefined,
        username: formData.username.trim() || undefined,
        phone: formData.phone.trim() || null,
        department: formData.department.trim() || null,
        year: formData.year.trim() || null,
        class: formData.class.trim() || null,
        bio: formData.bio.trim() || null,
        avatarUrl: formData.avatarUrl || null
      }

      const data = await apiRequest("/api/profile", {
        method: "PUT",
        body: JSON.stringify(cleanedData)
      })

      setSuccess(true)
      
      // Refresh the page to show updated data
      setTimeout(() => {
        router.refresh()
      }, 1000)
      
    } catch (err) {
      console.error('Profile update error:', err)
      const errorMessage = getErrorMessage(err)
      setError(errorMessage)
      
      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription className="flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <span>{error}</span>
          </AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-950">
          <AlertDescription className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <span className="text-lg">✅</span>
            <span>Profile updated successfully!</span>
          </AlertDescription>
        </Alert>
      )}
      {uploading && (
        <Alert className="mb-6 border-blue-500 bg-blue-50 dark:bg-blue-950">
          <AlertDescription className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
            <span className="text-lg">⏳</span>
            <span>Uploading image...</span>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="John Doe"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            placeholder="johndoe"
            pattern="[a-zA-Z0-9_]+"
            title="Only letters, numbers, and underscores allowed"
          />
          <p className="text-xs text-muted-foreground">
            Your public profile URL will be /u/{formData.username || "username"}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            value={profile.email}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">Email cannot be changed</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="9876543210"
            pattern="[0-9]{10}"
            title="10-digit phone number"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Input
            id="department"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            placeholder="Computer Science"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="year">Year</Label>
          <Input
            id="year"
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
            placeholder="2024"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="class">Class</Label>
          <Input
            id="class"
            value={formData.class}
            onChange={(e) => setFormData({ ...formData, class: e.target.value })}
            placeholder="B.Tech"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Profile Picture</Label>
          <div className="flex items-center gap-4">
            {formData.avatarUrl && (
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-border">
                <Image
                  src={formData.avatarUrl}
                  alt="Profile picture"
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
                {uploading ? "Uploading..." : formData.avatarUrl ? "Change Picture" : "Upload Picture"}
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                Max 2MB. JPG, PNG, or GIF.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          placeholder="Tell us about yourself..."
          rows={4}
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground text-right">
          {formData.bio.length}/500 characters
        </p>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Saving..." : "Save Changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
