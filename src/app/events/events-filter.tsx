"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, X, Filter } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export function EventsFilter({
  initialSearch,
  initialStatus,
  initialHostType
}: {
  initialSearch?: string
  initialStatus?: string
  initialHostType?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  const [search, setSearch] = useState(initialSearch || "")
  const [status, setStatus] = useState(initialStatus || "")
  const [hostType, setHostType] = useState(initialHostType || "")
  const [showFilters, setShowFilters] = useState(false)

  const hasActiveFilters = search || status || hostType

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams)
    
    if (search) {
      params.set('search', search)
    } else {
      params.delete('search')
    }
    
    if (status) {
      params.set('status', status)
    } else {
      params.delete('status')
    }
    
    if (hostType) {
      params.set('hostType', hostType)
    } else {
      params.delete('hostType')
    }

    startTransition(() => {
      router.push(`/events?${params.toString()}`)
    })
  }

  const handleClear = () => {
    setSearch("")
    setStatus("")
    setHostType("")
    startTransition(() => {
      router.push('/events')
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <Card className="border-primary/10">
      <CardContent className="p-3 sm:p-4 space-y-3">
        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10 pr-4"
            />
          </div>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className="shrink-0 px-3"
          >
            <Filter className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleSearch}
            disabled={isPending}
            className="shrink-0"
          >
            {isPending ? "..." : "Search"}
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <NativeSelect
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="UPCOMING">Upcoming</option>
                <option value="ONGOING">Ongoing</option>
                <option value="RESCHEDULED">Rescheduled</option>
              </NativeSelect>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Host Type</label>
              <NativeSelect
                value={hostType}
                onChange={(e) => setHostType(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="CLUB">Club</option>
                <option value="DEPARTMENT">Department</option>
                <option value="STUDENT_GROUP">Student Group</option>
                <option value="COLLEGE">College</option>
                <option value="OTHER">Other</option>
              </NativeSelect>
            </div>
          </div>
        )}

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <span className="text-xs text-muted-foreground">Active filters:</span>
            <div className="flex flex-wrap gap-2 flex-1">
              {search && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                  Search: {search}
                </span>
              )}
              {status && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                  Status: {status}
                </span>
              )}
              {hostType && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                  Host: {hostType.replace('_', ' ')}
                </span>
              )}
            </div>
            <Button
              onClick={handleClear}
              variant="ghost"
              size="sm"
              className="shrink-0"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
