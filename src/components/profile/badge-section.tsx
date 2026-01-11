"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge as BadgeUI } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { NativeSelect } from "@/components/ui/select"
import { apiRequest } from "@/lib/api-client"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Award } from "lucide-react"

type Badge = {
  id: string
  name: string
  description: string | null
  type: string
  iconUrl: string | null
  color: string
  earnedAt: string
  isVisible: boolean
}

const BADGE_TYPES = [
  "ACHIEVEMENT", "SKILL", "PARTICIPATION", "MILESTONE", "SPECIAL"
]

export function BadgeSection({ userId, isOwner = false }: { userId: string, isOwner?: boolean }) {
  const [badges, setBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "ACHIEVEMENT",
    iconUrl: "",
    color: "#3B82F6",
    isVisible: true
  })

  useEffect(() => {
    fetchBadges()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  async function fetchBadges() {
    try {
      const data = await apiRequest(`/api/profile/badges?userId=${userId}`)
      setBadges(data.badges || [])
    } catch (error) {
      console.error("Failed to fetch badges:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    try {
      await apiRequest("/api/profile/badges", {
        method: "POST",
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          isVisible: formData.isVisible,
          color: formData.color,
          description: formData.description || null,
          iconUrl: formData.iconUrl || null
        })
      })

      setDialogOpen(false)
      setFormData({
        name: "",
        description: "",
        type: "ACHIEVEMENT",
        iconUrl: "",
        color: "#3B82F6",
        isVisible: true
      })
      fetchBadges()
    } catch (error: any) {
      console.error("Failed to add badge:", error)
      const message = error?.message || "Failed to add badge. Please try again."
      alert(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading badges...</div>
  }

  const visibleBadges = isOwner ? badges : badges.filter(b => b.isVisible)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5" />
          Badges ({visibleBadges.length})
        </CardTitle>
        {isOwner && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Badge
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Badge</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Badge Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Top Contributor"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <NativeSelect
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                  >
                    {BADGE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type.replace('_', ' ')}
                      </option>
                    ))}
                  </NativeSelect>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="What this badge represents..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Badge Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      placeholder="#3B82F6"
                      pattern="^#[0-9A-Fa-f]{6}$"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="iconUrl">Icon URL (optional)</Label>
                  <Input
                    id="iconUrl"
                    type="url"
                    value={formData.iconUrl}
                    onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
                    placeholder="https://example.com/icon.png"
                  />
                </div>

                <Checkbox
                    checked={formData.isVisible}
                    onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                    label="Show on public profile"
                    size="sm"
                  />

                <div className="flex gap-3">
                  <Button type="submit" disabled={submitting} className="flex-1">
                    {submitting ? "Adding..." : "Add Badge"}
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
        {visibleBadges.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No badges yet</p>
            {isOwner && <p className="text-sm mt-2">Earn badges by participating in activities!</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
            {visibleBadges.map((badge) => (
              <div
                key={badge.id}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors hover:border-primary"
                style={{ borderColor: `${badge.color}40`, backgroundColor: `${badge.color}08` }}
                title={badge.description || badge.name}
              >
                {badge.iconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={badge.iconUrl} alt={badge.name} className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <Award className="w-4 h-4 flex-shrink-0" style={{ color: badge.color }} />
                )}
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm truncate block" style={{ color: badge.color }}>
                    {badge.name}
                  </span>
                  <BadgeUI variant="secondary" className="text-xs">
                    {badge.type}
                  </BadgeUI>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
