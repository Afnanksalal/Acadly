"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, X, Filter } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface Category {
  id: string
  name: string
}

export function ListingsSearch({
  categories,
  initialSearch,
  initialCategory,
  initialType
}: {
  categories: Category[]
  initialSearch?: string
  initialCategory?: string
  initialType?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  const [search, setSearch] = useState(initialSearch || "")
  const [category, setCategory] = useState(initialCategory || "")
  const [type, setType] = useState(initialType || "")
  const [showFilters, setShowFilters] = useState(false)

  const hasActiveFilters = search || category || type

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams)
    
    if (search) {
      params.set('search', search)
    } else {
      params.delete('search')
    }
    
    if (category) {
      params.set('category', category)
    } else {
      params.delete('category')
    }
    
    if (type) {
      params.set('type', type)
    } else {
      params.delete('type')
    }

    startTransition(() => {
      router.push(`/listings?${params.toString()}`)
    })
  }

  const handleClear = () => {
    setSearch("")
    setCategory("")
    setType("")
    startTransition(() => {
      router.push('/listings')
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
              placeholder="Search listings..."
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
              <label className="text-sm font-medium">Category</label>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="PRODUCT">Product</option>
                <option value="SERVICE">Service</option>
              </Select>
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
              {category && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                  Category: {categories.find(c => c.id === category)?.name}
                </span>
              )}
              {type && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                  Type: {type}
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
