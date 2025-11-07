'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { 
  ShoppingBag, 
  Search, 
  Trash2, 
  Eye, 
  EyeOff,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Listing {
  id: string
  title: string
  description: string
  price: string
  type: string
  isActive: boolean
  requiresApproval: boolean
  images: any
  createdAt: string
  user: {
    email: string
    name: string | null
  }
  category: {
    name: string
  }
  _count: {
    transactions: number
    chats: number
  }
}

export function ListingsManagement() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchListings()
  }, [])

  const fetchListings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/listings')
      if (response.ok) {
        const data = await response.json()
        setListings(data.data?.listings || data.listings || [])
      }
    } catch (error) {
      console.error('Failed to fetch listings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedListing) return

    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/listings/${selectedListing.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setListings(listings.filter(l => l.id !== selectedListing.id))
        setDeleteDialogOpen(false)
        setSelectedListing(null)
      } else {
        const data = await response.json()
        alert(data.error?.message || 'Failed to delete listing')
      }
    } catch (error) {
      console.error('Failed to delete listing:', error)
      alert('Failed to delete listing')
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleActive = async (listing: Listing) => {
    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/listings/${listing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: !listing.isActive
        })
      })

      if (response.ok) {
        setListings(listings.map(l => 
          l.id === listing.id ? { ...l, isActive: !l.isActive } : l
        ))
      } else {
        alert('Failed to update listing')
      }
    } catch (error) {
      console.error('Failed to update listing:', error)
      alert('Failed to update listing')
    } finally {
      setActionLoading(false)
    }
  }

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         listing.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         listing.user.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && listing.isActive) ||
                         (statusFilter === 'inactive' && !listing.isActive)
    
    const matchesType = typeFilter === 'all' || listing.type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold">Listings Management</h2>
      </div>

      {/* Filters */}
      <Card className="border-primary/10">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search listings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>

            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="PRODUCT">Product</option>
              <option value="SERVICE">Service</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Listings List */}
      <Card className="hover-lift">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle>All Listings ({filteredListings.length})</CardTitle>
          <CardDescription>Manage and moderate marketplace listings</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="space-y-3 sm:space-y-4">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center p-3 sm:p-4 border border-primary/10 rounded-lg bg-muted/20 animate-pulse">
                  <div className="w-16 h-16 bg-muted rounded mr-4"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-48 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-64"></div>
                  </div>
                </div>
              ))
            ) : filteredListings.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-lg font-medium mb-2">No listings found</p>
                <p className="text-sm text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                    ? 'Try adjusting your filters' 
                    : 'No listings have been created yet'}
                </p>
              </div>
            ) : (
              filteredListings.map((listing) => {
                const images = Array.isArray(listing.images) ? listing.images : []
                const firstImage = typeof images[0] === 'string' ? images[0] : undefined

                return (
                  <div
                    key={listing.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border border-primary/10 rounded-lg bg-muted/20 gap-3"
                  >
                    <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                      {/* Image */}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-muted shrink-0">
                        {firstImage ? (
                          <Image
                            src={firstImage}
                            alt={listing.title}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                            <ShoppingBag className="h-6 w-6 opacity-30" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm sm:text-base line-clamp-1">
                            {listing.title}
                          </h4>
                          <Badge variant={listing.isActive ? 'default' : 'secondary'}>
                            {listing.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline">
                            {listing.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1 mb-1">
                          {listing.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-semibold text-primary">₹{listing.price}</span>
                          <span>•</span>
                          <span>{listing.category.name}</span>
                          <span>•</span>
                          <span>By: {listing.user.name || listing.user.email}</span>
                          {listing._count.transactions > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-orange-500">
                                {listing._count.transactions} transaction(s)
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end shrink-0">
                      <Link href={`/listings/${listing.id}`} target="_blank">
                        <Button variant="outline" size="sm" className="text-xs">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => handleToggleActive(listing)}
                        disabled={actionLoading}
                      >
                        {listing.isActive ? (
                          <>
                            <EyeOff className="h-3 w-3 mr-1" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3 mr-1" />
                            Activate
                          </>
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          setSelectedListing(listing)
                          setDeleteDialogOpen(true)
                        }}
                        disabled={actionLoading || listing._count.transactions > 0}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Listing?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedListing?.title}"? This action cannot be undone.
              {selectedListing && selectedListing._count.chats > 0 && (
                <div className="mt-2 p-2 bg-orange-500/10 border border-orange-500/20 rounded text-orange-600 dark:text-orange-400 text-sm">
                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                  This listing has {selectedListing._count.chats} chat(s) which will also be deleted.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
