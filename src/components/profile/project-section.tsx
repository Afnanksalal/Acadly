"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { apiRequest } from "@/lib/api-client"
import { Plus, Code, Github, ExternalLink, Calendar } from "lucide-react"

type Project = {
  id: string
  title: string
  description: string
  category: string
  technologies: string[]
  githubUrl: string | null
  liveUrl: string | null
  imageUrls: string[]
  startDate: string | null
  endDate: string | null
  status: string
  isPublic: boolean
  createdAt: string
}

const PROJECT_CATEGORIES = [
  "ACADEMIC", "PERSONAL", "HACKATHON", "INTERNSHIP", "FREELANCE", "OPEN_SOURCE", "RESEARCH"
]

const PROJECT_STATUSES = [
  "PLANNING", "IN_PROGRESS", "COMPLETED", "PAUSED", "CANCELLED"
]

const STATUS_COLORS: Record<string, string> = {
  PLANNING: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  PAUSED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
}

export function ProjectSection({ userId, isOwner = false }: { userId: string, isOwner?: boolean }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "ACADEMIC",
    technologies: "",
    githubUrl: "",
    liveUrl: "",
    startDate: "",
    endDate: "",
    status: "COMPLETED",
    isPublic: true
  })

  useEffect(() => {
    fetchProjects()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  async function fetchProjects() {
    try {
      const data = await apiRequest(`/api/profile/projects?userId=${userId}`)
      setProjects(data.projects || [])
    } catch (error) {
      console.error("Failed to fetch projects:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    try {
      const technologies = formData.technologies
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)

      await apiRequest("/api/profile/projects", {
        method: "POST",
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          status: formData.status,
          isPublic: formData.isPublic,
          technologies,
          startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
          endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
          githubUrl: formData.githubUrl || null,
          liveUrl: formData.liveUrl || null
        })
      })

      setDialogOpen(false)
      setFormData({
        title: "",
        description: "",
        category: "ACADEMIC",
        technologies: "",
        githubUrl: "",
        liveUrl: "",
        startDate: "",
        endDate: "",
        status: "COMPLETED",
        isPublic: true
      })
      fetchProjects()
    } catch (error: any) {
      console.error("Failed to add project:", error)
      const message = error?.message || "Failed to add project. Please try again."
      alert(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading projects...</div>
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Code className="w-5 h-5" />
          Projects ({projects.length})
        </CardTitle>
        {isOwner && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Project</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Project Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., E-commerce Platform"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your project..."
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                    >
                      {PROJECT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat.replace('_', ' ')}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      id="status"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      required
                    >
                      {PROJECT_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status.replace('_', ' ')}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="technologies">Technologies (comma-separated)</Label>
                  <Input
                    id="technologies"
                    value={formData.technologies}
                    onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
                    placeholder="e.g., React, Node.js, MongoDB"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="githubUrl">GitHub URL</Label>
                    <Input
                      id="githubUrl"
                      type="url"
                      value={formData.githubUrl}
                      onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                      placeholder="https://github.com/..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="liveUrl">Live URL</Label>
                    <Input
                      id="liveUrl"
                      type="url"
                      value={formData.liveUrl}
                      onChange={(e) => setFormData({ ...formData, liveUrl: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="isPublic" className="cursor-pointer">
                    Show on public profile
                  </Label>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={submitting} className="flex-1">
                    {submitting ? "Adding..." : "Add Project"}
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
        {projects.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No projects yet</p>
            {isOwner && <p className="text-sm mt-2">Showcase your work by adding projects!</p>}
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {projects.map((project) => (
              <div key={project.id} className="border border-border rounded-lg p-3 hover:border-primary transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-1 line-clamp-1">{project.title}</h3>
                    <div className="flex flex-wrap gap-1 mb-2">
                      <Badge variant="outline" className="text-xs">{project.category.replace('_', ' ')}</Badge>
                      <Badge className={`text-xs ${STATUS_COLORS[project.status] || STATUS_COLORS.COMPLETED}`}>
                        {project.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary"
                      >
                        <Github className="w-4 h-4" />
                      </a>
                    )}
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{project.description}</p>

                {project.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {project.technologies.slice(0, 4).map((tech, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-1 rounded-full bg-secondary/20 text-secondary"
                      >
                        {tech}
                      </span>
                    ))}
                    {project.technologies.length > 4 && (
                      <span className="text-xs px-2 py-1 rounded-full bg-secondary/20 text-secondary">
                        +{project.technologies.length - 4}
                      </span>
                    )}
                  </div>
                )}

                {(project.startDate || project.endDate) && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {project.startDate && new Date(project.startDate).toLocaleDateString()}
                    {project.startDate && project.endDate && " - "}
                    {project.endDate && new Date(project.endDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
