'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, UserCheck, UserX, Shield, Search } from 'lucide-react'

interface UserData {
  id: string
  name: string | null
  email: string
  role: string
  verified: boolean
  createdAt: string
  _count: {
    purchases: number
    sales: number
    listings: number
  }
}

interface UserStats {
  totalUsers: number
  verifiedUsers: number
  adminUsers: number
  suspendedUsers: number
}

export function UserManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [users, setUsers] = useState<UserData[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
    fetchStats()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const result = await response.json()
        setUsers(result.data.users || [])
      } else {
        console.error('Failed to fetch users:', response.statusText)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/analytics')
      if (response.ok) {
        const result = await response.json()
        const overview = result.data.overview
        setStats({
          totalUsers: overview.totalUsers,
          verifiedUsers: overview.verifiedUsers,
          adminUsers: 0, // Will be calculated from users data
          suspendedUsers: 0 // Will be calculated from users data
        })
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) return
    
    try {
      const response = await fetch('/api/admin/users/advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          userIds: selectedUsers,
          reason: `Bulk ${action.toLowerCase()} action`
        })
      })
      
      if (response.ok) {
        // Refresh user list
        setSelectedUsers([])
      }
    } catch (error) {
      console.error('Bulk action failed:', error)
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
              {loading ? '...' : stats?.totalUsers.toLocaleString() || '0'}
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
              {loading ? '...' : stats?.verifiedUsers.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats && stats.totalUsers > 0 
                ? `${Math.round((stats.verifiedUsers / stats.totalUsers) * 100)}% verification rate`
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
              {loading ? '...' : stats ? (stats.totalUsers - stats.verifiedUsers).toLocaleString() : '0'}
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
              {loading ? '...' : users.filter(u => u.role === 'ADMIN').length}
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
                Verify Users
              </Button>
              <Button onClick={() => handleBulkAction('SUSPEND')} variant="destructive" size="sm">
                Suspend Users
              </Button>
              <Button onClick={() => handleBulkAction('PROMOTE')} variant="outline" size="sm">
                Promote to Admin
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
                      {user._count.purchases + user._count.sales} transactions • {user._count.listings} listings • Joined {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 sm:flex-shrink-0">
                  <Button variant="outline" size="sm" className="text-xs">
                    View Profile
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs">
                    Edit
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
    </div>
  )
}