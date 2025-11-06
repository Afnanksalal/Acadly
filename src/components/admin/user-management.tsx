'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Users, UserCheck, UserX, Shield, Search, Edit, Eye, Trash2, CheckCircle } from 'lucide-react'

interface UserData {
  id: string
  name: string | null
  username: string | null
  email: string
  role: string
  verified: boolean
  department?: string | null
  year?: string | null
  bio?: string | null
  ratingAvg?: number
  ratingCount?: number
  createdAt: string
  totalTransactions?: number
  totalListings?: number
  _count: {
    purchases: number
    sales: number
    listings: number
    reviewsReceived?: number
    disputes?: number
  }
}

interface UserStats {
  total: number
  verified: number
  unverified: number
  admins: number
  users: number
}

export function UserManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [users, setUsers] = useState<UserData[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [viewingUser, setViewingUser] = useState<UserData | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const result = await response.json()
        setUsers(result.data.users || [])
        setStats(result.data.stats || null)
      } else {
        console.error('Failed to fetch users:', response.statusText)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) return
    
    if (!confirm(`Are you sure you want to ${action.toLowerCase()} ${selectedUsers.length} users?`)) {
      return
    }
    
    try {
      const response = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          userIds: selectedUsers,
          reason: `Bulk ${action.toLowerCase()} action by admin`
        })
      })
      
      if (response.ok) {
        setSelectedUsers([])
        fetchUsers() // Refresh the list
        alert(`Successfully ${action.toLowerCase()}ed ${selectedUsers.length} users`)
      } else {
        const error = await response.json()
        alert(`Failed to ${action.toLowerCase()} users: ${error.message}`)
      }
    } catch (error) {
      console.error('Bulk action failed:', error)
      alert('Bulk action failed')
    }
  }

  const handleEditUser = async (userData: Partial<UserData>) => {
    if (!editingUser) return

    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      })

      if (response.ok) {
        setEditDialogOpen(false)
        setEditingUser(null)
        fetchUsers() // Refresh the list
        alert('User updated successfully')
      } else {
        const error = await response.json()
        alert(`Failed to update user: ${error.message}`)
      }
    } catch (error) {
      console.error('Failed to update user:', error)
      alert('Failed to update user')
    }
  }

  const handleViewUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`)
      if (response.ok) {
        const result = await response.json()
        setViewingUser(result.data)
        setViewDialogOpen(true)
      }
    } catch (error) {
      console.error('Failed to fetch user details:', error)
    }
  }

  const handleDeleteUser = async (userId: string, action: 'suspend' | 'delete') => {
    const confirmMessage = action === 'delete' 
      ? 'Are you sure you want to permanently delete this user and all their data? This cannot be undone.'
      : 'Are you sure you want to suspend this user?'
    
    if (!confirm(confirmMessage)) return

    try {
      const response = await fetch(`/api/admin/users/${userId}?action=${action}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchUsers() // Refresh the list
        alert(`User ${action}ed successfully`)
      } else {
        const error = await response.json()
        alert(`Failed to ${action} user: ${error.message}`)
      }
    } catch (error) {
      console.error(`Failed to ${action} user:`, error)
      alert(`Failed to ${action} user`)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold">User Management</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search users..."
              className="pl-10 pr-4 py-2 border border-primary/10 rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-primary">
              {loading ? '...' : stats?.total.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">Registered accounts</p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
            <CardTitle className="text-sm font-medium">Verified Users</CardTitle>
            <UserCheck className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-green-400">
              {loading ? '...' : stats?.verified.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats && stats.total > 0 
                ? `${Math.round((stats.verified / stats.total) * 100)}% verification rate`
                : 'Verification rate'
              }
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
            <CardTitle className="text-sm font-medium">Unverified Users</CardTitle>
            <UserX className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-yellow-400">
              {loading ? '...' : stats?.unverified.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">Pending verification</p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
            <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
            <Shield className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-secondary">
              {loading ? '...' : stats?.admins || '0'}
            </div>
            <p className="text-xs text-muted-foreground">Active administrators</p>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <Card className="hover-lift">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle>Bulk Actions ({selectedUsers.length} selected)</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => handleBulkAction('VERIFY')} size="sm" className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verify Users
              </Button>
              <Button onClick={() => handleBulkAction('SUSPEND')} variant="destructive" size="sm">
                <UserX className="h-3 w-3 mr-1" />
                Suspend Users
              </Button>
              <Button onClick={() => handleBulkAction('PROMOTE')} variant="outline" size="sm">
                <Shield className="h-3 w-3 mr-1" />
                Promote to Admin
              </Button>
              <Button onClick={() => handleBulkAction('DEMOTE')} variant="outline" size="sm">
                <Users className="h-3 w-3 mr-1" />
                Demote to User
              </Button>
              <Button onClick={() => handleBulkAction('DELETE')} variant="destructive" size="sm">
                <Trash2 className="h-3 w-3 mr-1" />
                Delete Users
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User List */}
      <Card className="hover-lift">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle>User List</CardTitle>
          <CardDescription>Manage user accounts and permissions</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="space-y-3 sm:space-y-4">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center p-3 sm:p-4 border border-primary/10 rounded-lg bg-muted/20 animate-pulse">
                  <div className="w-4 h-4 bg-muted rounded mr-3"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-32 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-48 mb-1"></div>
                    <div className="h-3 bg-muted rounded w-24"></div>
                  </div>
                </div>
              ))
            ) : users.filter(user => 
              user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              user.email.toLowerCase().includes(searchTerm.toLowerCase())
            ).map((user) => (
              <div key={user.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border border-primary/10 rounded-lg bg-muted/20 gap-3">
                <div className="flex items-start gap-3 sm:gap-4">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers([...selectedUsers, user.id])
                      } else {
                        setSelectedUsers(selectedUsers.filter(id => id !== user.id))
                      }
                    }}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm sm:text-base">{user.name || 'No Name'}</h4>
                      <Badge variant={user.verified ? 'default' : 'secondary'}>
                        {user.verified ? 'Verified' : 'Unverified'}
                      </Badge>
                      <Badge variant={user.role === 'ADMIN' ? 'destructive' : 'outline'}>
                        {user.role}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground break-all">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.totalTransactions || (user._count.purchases + user._count.sales)} transactions • {user.totalListings || user._count.listings} listings • Joined {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 sm:flex-shrink-0">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => handleViewUser(user.id)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => {
                      setEditingUser(user)
                      setEditDialogOpen(true)
                    }}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => handleDeleteUser(user.id, 'suspend')}
                  >
                    <UserX className="h-3 w-3 mr-1" />
                    Suspend
                  </Button>
                </div>
              </div>
            ))}
            {!loading && users.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No users found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User: {editingUser?.name || editingUser?.email}</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              handleEditUser({
                name: formData.get('name') as string,
                username: formData.get('username') as string,
                department: formData.get('department') as string,
                year: formData.get('year') as string,
                bio: formData.get('bio') as string,
                verified: formData.get('verified') === 'true',
                role: formData.get('role') as 'USER' | 'ADMIN'
              })
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={editingUser.name || ''}
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    defaultValue={editingUser.username || ''}
                    placeholder="Username"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    name="department"
                    defaultValue={editingUser.department || ''}
                    placeholder="Department"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    name="year"
                    defaultValue={editingUser.year || ''}
                    placeholder="Year"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  defaultValue={editingUser.bio || ''}
                  placeholder="User bio"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="verified">Verification Status</Label>
                  <Select name="verified" defaultValue={editingUser.verified.toString()}>
                    <option value="true">Verified</option>
                    <option value="false">Unverified</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select name="role" defaultValue={editingUser.role}>
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  Update User
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* View User Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details: {viewingUser?.name || viewingUser?.email}</DialogTitle>
          </DialogHeader>
          {viewingUser && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm text-muted-foreground">{viewingUser.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Username</Label>
                  <p className="text-sm text-muted-foreground">{viewingUser.username || 'Not set'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Department</Label>
                  <p className="text-sm text-muted-foreground">{viewingUser.department || 'Not set'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Year</Label>
                  <p className="text-sm text-muted-foreground">{viewingUser.year || 'Not set'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Rating</Label>
                  <p className="text-sm text-muted-foreground">
                    {viewingUser.ratingAvg ? viewingUser.ratingAvg.toFixed(1) : '0.0'} ★ ({viewingUser.ratingCount || 0} reviews)
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Joined</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(viewingUser.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex gap-2">
                <Badge variant={viewingUser.verified ? 'default' : 'secondary'}>
                  {viewingUser.verified ? 'Verified' : 'Unverified'}
                </Badge>
                <Badge variant={viewingUser.role === 'ADMIN' ? 'destructive' : 'outline'}>
                  {viewingUser.role}
                </Badge>
              </div>

              {/* Bio */}
              {viewingUser.bio && (
                <div>
                  <Label className="text-sm font-medium">Bio</Label>
                  <p className="text-sm text-muted-foreground mt-1">{viewingUser.bio}</p>
                </div>
              )}

              {/* Activity Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-3 bg-muted/20 rounded-lg">
                  <div className="text-lg font-bold">{viewingUser._count.listings}</div>
                  <div className="text-xs text-muted-foreground">Listings</div>
                </div>
                <div className="text-center p-3 bg-muted/20 rounded-lg">
                  <div className="text-lg font-bold">{viewingUser._count.sales}</div>
                  <div className="text-xs text-muted-foreground">Sales</div>
                </div>
                <div className="text-center p-3 bg-muted/20 rounded-lg">
                  <div className="text-lg font-bold">{viewingUser._count.purchases}</div>
                  <div className="text-xs text-muted-foreground">Purchases</div>
                </div>
                <div className="text-center p-3 bg-muted/20 rounded-lg">
                  <div className="text-lg font-bold">{viewingUser._count.reviewsReceived || 0}</div>
                  <div className="text-xs text-muted-foreground">Reviews</div>
                </div>
                <div className="text-center p-3 bg-muted/20 rounded-lg">
                  <div className="text-lg font-bold">{viewingUser._count.disputes || 0}</div>
                  <div className="text-xs text-muted-foreground">Disputes</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setViewDialogOpen(false)
                    setEditingUser(viewingUser)
                    setEditDialogOpen(true)
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit User
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    setViewDialogOpen(false)
                    handleDeleteUser(viewingUser.id, 'suspend')
                  }}
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Suspend User
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    setViewDialogOpen(false)
                    handleDeleteUser(viewingUser.id, 'delete')
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete User
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}