"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { NativeSelect } from "@/components/ui/select"
import { apiRequest } from "@/lib/api-client"
import { Plus, Trophy, Calendar, Award } from "lucide-react"
import Image from "next/image"

type Trophy = {
  id: string
  title: string
  description: string | null
  category: string
  awardedBy: string | null
  awardedAt: string
  imageUrl: string | null
  isVerified: boolean
  createdAt: string
}

const TROPHY_CATEGORIES = [
  "ACADEMIC", "SPORTS", "CULTURAL", "TECHNICAL", "LEADERSHIP", "COMMUNITY", "OTHER"
]

const CATEGORY_COLORS: Record<string, string> = {
  ACADEMIC: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  SPORTS: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  CULTURAL: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  TECHNICAL: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  LEADERSHIP: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  COMMUNITY: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  OTHER: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
}

export function TrophySection({ userId, isOwner = false }: { userId: string, isOwner?: boolean }) {
  const [trophies, setTrophies] = useState<Trophy[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "ACADEMIC",
    awardedBy: "",
    awardedAt: new Date().toISOString().split('T')[0],
    imageUrl: ""
  })

  useEffect(() => {
    fetchTrophies()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  async function fetchTrophies() {
    try {
      const data = await apiRequest(`/api/profile/trophies?userId=${userId}`)
      setTrophies(data.trophies || [])
    } catch (error) {
      console.error("Failed to fetch trophies:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    try {
      await apiRequest("/api/profile/trophies", {
        method: "POST",
        body: JSON.stringify({
          title: formData.title,
          category: formData.category,
          awardedAt: new Date(formData.awardedAt).toISOString(),
          description: formData.description || null,
          awardedBy: formData.awardedBy || null,
          imageUrl: formData.imageUrl || null
        })
      })

      setDialogOpen(false)
      setFormData({
        title: "",
        description: "",
        category: "ACADEMIC",
        awardedBy: "",
        awardedAt: new Date().toISOString().split('T')[0],
        imageUrl: ""
      })
      fetchTrophies()
    } catch (error: any) {
      console.error("Failed to add trophy:", error)
      const message = error?.message || "Failed to add trophy. Please try again."
      alert(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading trophies...</div>
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Trophies & Awards ({trophies.length})
        </CardTitle>
        {isOwner && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Trophy
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Trophy</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Trophy Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., First Prize in Hackathon"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <NativeSelect
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                    >
                      {TROPHY_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat.replace('_', ' ')}
                        </option>
                      ))}
                    </NativeSelect>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="awardedAt">Date Awarded *</Label>
                    <Input
                      id="awardedAt"
                      type="date"
                      value={formData.awardedAt}
                      onChange={(e) => setFormData({ ...formData, awardedAt: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="awardedBy">Awarded By</Label>
                  <Input
                    id="awardedBy"
                    value={formData.awardedBy}
                    onChange={(e) => setFormData({ ...formData, awardedBy: e.target.value })}
                    placeholder="e.g., IEEE, College, Organization"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your achievement..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="imageUrl">Image URL (optional)</Label>
                  <Input
                    id="imageUrl"
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://example.com/trophy.jpg"
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={submitting} className="flex-1">
                    {submitting ? "Adding..." : "Add Trophy"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {trophies.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No trophies yet</p>
            {isOwner && <p className="text-sm mt-2">Add your achievements to showcase them!</p>}
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {trophies.map((trophy) => (
              <div key={trophy.id} className="border border-border rounded-lg p-3 hover:border-primary transition-colors">
                <div className="flex items-start gap-3">
                  {trophy.imageUrl ? (
                    <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden">
                      <Image src={trophy.imageUrl} alt={trophy.title} fill sizes="48px" className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-secondary/20 flex items-center justify-center">
                      <Award className="w-6 h-6 text-secondary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-sm line-clamp-1">{trophy.title}</h3>
                      {trophy.isVerified && (
                        <Badge variant="secondary" className="flex-shrink-0 text-xs">✓</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      <Badge className={`text-xs ${CATEGORY_COLORS[trophy.category] || CATEGORY_COLORS.OTHER}`}>
                        {trophy.category.replace('_', ' ')}
                      </Badge>
                    </div>
                    {trophy.description && (
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{trophy.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {trophy.awardedBy && (
                        <span className="flex items-center gap-1 truncate">
                          <Award className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{trophy.awardedBy}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1 flex-shrink-0">
                        <Calendar className="w-3 h-3" />
                        {new Date(trophy.awardedAt).toLocaleDateString()}
                      </span>
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
