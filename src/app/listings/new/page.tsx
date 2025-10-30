"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { supabaseClient } from "@/lib/supabase-client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { apiRequest, getErrorMessage } from "@/lib/api-client"

export default function NewListingPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
  const [type, setType] = useState<"PRODUCT" | "SERVICE">("PRODUCT")
  const [userId, setUserId] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const router = useRouter()

  useEffect(() => {
    // Check auth BEFORE allowing user to fill form
    supabaseClient.auth.getUser().then(async (res) => {
      const id = res.data.user?.id
      
      if (!id) {
        // Redirect to login if not authenticated
        router.push('/auth/login?redirect=/listings/new')
        return
      }
      
      // Check if verified
      const profileRes = await fetch('/api/profile')
      if (profileRes.ok) {
        const { profile } = await profileRes.json()
        if (!profile.verified) {
          setError('Please verify your account to create listings')
          return
        }
      }
      
      setUserId(id)
    })
    fetch("/api/categories").then(r => r.json()).then((list: Array<{ id: string; name: string }>) => setCategories(list))
  }, [router])

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    const remainingSlots = 5 - imageUrls.length
    const filesToUpload = Array.from(files).slice(0, remainingSlots)

    if (filesToUpload.length === 0) {
      setUploadError("Maximum 5 images allowed")
      return
    }

    setUploadingImages(true)
    setUploadError("")

    try {
      const uploadPromises = filesToUpload.map(async (file) => {
        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} is too large (max 5MB)`)
        }

        // Validate file type
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
          throw new Error(`${file.name} is not a valid image format`)
        }

        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error?.message || 'Upload failed')
        }

        const data = await response.json()
        return data.url
      })

      const uploadedUrls = await Promise.all(uploadPromises)
      setImageUrls([...imageUrls, ...uploadedUrls])
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to upload images')
    } finally {
      setUploadingImages(false)
      // Reset file input
      e.target.value = ''
    }
  }

  async function removeImage(index: number) {
    const urlToRemove = imageUrls[index]
    const filename = urlToRemove.split('/').pop()
    
    // Optimistically remove from UI
    setImageUrls(imageUrls.filter((_, i) => i !== index))

    // Try to delete from storage (don't block on failure)
    if (filename) {
      try {
        await fetch(`/api/upload?filename=${encodeURIComponent(filename)}`, {
          method: 'DELETE'
        })
      } catch (err) {
        console.error('Failed to delete image:', err)
      }
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!userId) { setError("Please login."); return }
    if (!categoryId) { setError("Category is required."); return }
    if (!title || !price) { setError("Title and price are required."); return }
    if (parseFloat(price) <= 0) { setError("Price must be greater than 0."); return }
    setLoading(true)
    try {
      await apiRequest("/api/listings", {
        method: "POST",
        body: JSON.stringify({ userId, title, description, price, categoryId, type, images: imageUrls })
      })
      
      router.push("/listings")
      router.refresh()
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create New Listing</CardTitle>
          <p className="text-sm opacity-70">Share what you&apos;re selling or offering</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Title *</label>
              <Input
                placeholder="e.g. Calculus Textbook 10th Edition"
                value={title}
                onChange={e => setTitle(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Describe your item or service in detail..."
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Price (₹) *</label>
                <Input
                  placeholder="500"
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Category *</label>
                <Select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setType("PRODUCT")}
                  disabled={loading}
                  className={`px-4 py-2 rounded-md border transition-all ${
                    type === "PRODUCT"
                      ? "bg-primary text-white border-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  Product
                </button>
                <button
                  type="button"
                  onClick={() => setType("SERVICE")}
                  disabled={loading}
                  className={`px-4 py-2 rounded-md border transition-all ${
                    type === "SERVICE"
                      ? "bg-primary text-white border-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  Service
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Images (Optional)</label>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="flex-1">
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        multiple
                        onChange={handleImageUpload}
                        disabled={loading || uploadingImages || imageUrls.length >= 5}
                        className="hidden"
                      />
                      <div className="space-y-2">
                        <div className="text-4xl">📸</div>
                        <p className="text-sm font-medium">
                          {uploadingImages ? 'Uploading...' : 'Click to upload images'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          JPEG, PNG, WebP, GIF • Max 5MB each • Up to 5 images
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
                {uploadError && (
                  <Alert variant="destructive">
                    <AlertDescription>{uploadError}</AlertDescription>
                  </Alert>
                )}
                <p className="text-xs text-muted-foreground">
                  {imageUrls.length}/5 images uploaded
                </p>
              </div>
              {imageUrls.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {imageUrls.map((url, i) => (
                    <div key={i} className="relative group">
                      <Image src={url} alt={`Preview ${i + 1}`} width={80} height={80} className="w-20 h-20 object-cover rounded-md border border-border" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Creating..." : "Create Listing"}
              </Button>
              <Button
                type="button"
                onClick={() => router.back()}
                disabled={loading}
                className="bg-muted text-foreground hover:bg-muted/80"
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
