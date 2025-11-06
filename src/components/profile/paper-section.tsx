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
import { Plus, FileText, ExternalLink, Calendar, Quote } from "lucide-react"

type Paper = {
  id: string
  title: string
  abstract: string | null
  authors: string[]
  journal: string | null
  conference: string | null
  publishedAt: string | null
  doi: string | null
  pdfUrl: string | null
  category: string
  keywords: string[]
  citations: number
  isVerified: boolean
  createdAt: string
}

const PAPER_CATEGORIES = [
  "RESEARCH", "REVIEW", "CONFERENCE", "JOURNAL", "THESIS", "DISSERTATION"
]

export function PaperSection({ userId, isOwner = false }: { userId: string, isOwner?: boolean }) {
  const [papers, setPapers] = useState<Paper[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    abstract: "",
    authors: "",
    journal: "",
    conference: "",
    publishedAt: "",
    doi: "",
    pdfUrl: "",
    category: "RESEARCH",
    keywords: "",
    citations: 0
  })

  useEffect(() => {
    fetchPapers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  async function fetchPapers() {
    try {
      const data = await apiRequest(`/api/profile/papers?userId=${userId}`)
      setPapers(data.papers || [])
    } catch (error) {
      console.error("Failed to fetch papers:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    try {
      const authors = formData.authors
        .split(',')
        .map(a => a.trim())
        .filter(a => a.length > 0)

      const keywords = formData.keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0)

      await apiRequest("/api/profile/papers", {
        method: "POST",
        body: JSON.stringify({
          title: formData.title,
          category: formData.category,
          citations: formData.citations,
          authors,
          keywords,
          publishedAt: formData.publishedAt ? new Date(formData.publishedAt).toISOString() : null,
          journal: formData.journal || null,
          conference: formData.conference || null,
          doi: formData.doi || null,
          pdfUrl: formData.pdfUrl || null,
          abstract: formData.abstract || null
        })
      })

      setDialogOpen(false)
      setFormData({
        title: "",
        abstract: "",
        authors: "",
        journal: "",
        conference: "",
        publishedAt: "",
        doi: "",
        pdfUrl: "",
        category: "RESEARCH",
        keywords: "",
        citations: 0
      })
      fetchPapers()
    } catch (error: any) {
      console.error("Failed to add paper:", error)
      const message = error?.message || "Failed to add paper. Please try again."
      alert(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading papers...</div>
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Research Papers ({papers.length})
        </CardTitle>
        {isOwner && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Paper
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Research Paper</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Paper Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Machine Learning in Healthcare"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="abstract">Abstract</Label>
                  <Textarea
                    id="abstract"
                    value={formData.abstract}
                    onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
                    placeholder="Brief summary of the paper..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="authors">Authors (comma-separated) *</Label>
                  <Input
                    id="authors"
                    value={formData.authors}
                    onChange={(e) => setFormData({ ...formData, authors: e.target.value })}
                    placeholder="e.g., John Doe, Jane Smith"
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
                      {PAPER_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="publishedAt">Published Date</Label>
                    <Input
                      id="publishedAt"
                      type="date"
                      value={formData.publishedAt}
                      onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="journal">Journal</Label>
                    <Input
                      id="journal"
                      value={formData.journal}
                      onChange={(e) => setFormData({ ...formData, journal: e.target.value })}
                      placeholder="e.g., Nature"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="conference">Conference</Label>
                    <Input
                      id="conference"
                      value={formData.conference}
                      onChange={(e) => setFormData({ ...formData, conference: e.target.value })}
                      placeholder="e.g., IEEE Conference"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="doi">DOI</Label>
                  <Input
                    id="doi"
                    value={formData.doi}
                    onChange={(e) => setFormData({ ...formData, doi: e.target.value })}
                    placeholder="e.g., 10.1000/xyz123"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pdfUrl">PDF URL</Label>
                  <Input
                    id="pdfUrl"
                    type="url"
                    value={formData.pdfUrl}
                    onChange={(e) => setFormData({ ...formData, pdfUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                  <Input
                    id="keywords"
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    placeholder="e.g., AI, Healthcare, Deep Learning"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="citations">Citations Count</Label>
                  <Input
                    id="citations"
                    type="number"
                    min="0"
                    value={formData.citations}
                    onChange={(e) => setFormData({ ...formData, citations: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={submitting} className="flex-1">
                    {submitting ? "Adding..." : "Add Paper"}
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
        {papers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No research papers yet</p>
            {isOwner && <p className="text-sm mt-2">Add your published research work!</p>}
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {papers.map((paper) => (
              <div key={paper.id} className="border border-border rounded-lg p-3 hover:border-primary transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-1 line-clamp-1">{paper.title}</h3>
                    <div className="flex flex-wrap gap-1 mb-2">
                      <Badge variant="outline" className="text-xs">{paper.category}</Badge>
                      {paper.isVerified && (
                        <Badge variant="secondary" className="text-xs">✓</Badge>
                      )}
                      {paper.citations > 0 && (
                        <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                          <Quote className="w-3 h-3" />
                          {paper.citations}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {paper.pdfUrl && (
                    <a
                      href={paper.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary flex-shrink-0"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>

                <p className="text-xs text-muted-foreground mb-2">
                  <span className="font-medium">Authors:</span> {paper.authors.slice(0, 2).join(', ')}{paper.authors.length > 2 && ` +${paper.authors.length - 2}`}
                </p>

                {paper.abstract && (
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{paper.abstract}</p>
                )}

                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-2">
                  {paper.journal && (
                    <span className="truncate">
                      <span className="font-medium">Journal:</span> {paper.journal}
                    </span>
                  )}
                  {paper.conference && (
                    <span className="truncate">
                      <span className="font-medium">Conf:</span> {paper.conference}
                    </span>
                  )}
                </div>

                {paper.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {paper.keywords.slice(0, 3).map((keyword, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-1 rounded-full bg-secondary/20 text-secondary"
                      >
                        {keyword}
                      </span>
                    ))}
                    {paper.keywords.length > 3 && (
                      <span className="text-xs px-2 py-1 rounded-full bg-secondary/20 text-secondary">
                        +{paper.keywords.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {paper.publishedAt && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {new Date(paper.publishedAt).toLocaleDateString()}
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
