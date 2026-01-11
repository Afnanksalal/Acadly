'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Settings, Shield, Bell, Download, Database } from 'lucide-react'

export function AdminSettings() {
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [lastBackup, setLastBackup] = useState<string | null>(null)
  const [exporting, setExporting] = useState<string | null>(null)

  useEffect(() => {
    fetchBackupStatus()
  }, [])

  const fetchBackupStatus = async () => {
    try {
      const response = await fetch('/api/admin/system/backup')
      if (response.ok) {
        const result = await response.json()
        if (result.data?.backups?.length > 0) {
          const latest = result.data.backups[0]
          setLastBackup(new Date(latest.createdAt).toLocaleDateString())
        }
      }
    } catch {
      // Silently fail - backup info is optional
    }
  }

  const toggleMaintenanceMode = async () => {
    try {
      const response = await fetch('/api/admin/settings/advanced/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: !maintenanceMode,
          message: 'System maintenance in progress. Please check back later.',
          allowedRoles: ['ADMIN']
        })
      })
      
      if (response.ok) {
        setMaintenanceMode(!maintenanceMode)
      }
    } catch {
      // Handle error silently
    }
  }

  const handleExport = async (type: 'users' | 'transactions' | 'backup') => {
    setExporting(type)
    try {
      if (type === 'backup') {
        const response = await fetch('/api/admin/system/backup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'full' })
        })
        if (response.ok) {
          fetchBackupStatus()
          alert('Backup created successfully')
        }
      } else {
        const response = await fetch(`/api/admin/export?type=${type}`)
        if (response.ok) {
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${type}-export-${new Date().toISOString().split('T')[0]}.csv`
          a.click()
          window.URL.revokeObjectURL(url)
        } else {
          alert('Export feature coming soon')
        }
      }
    } catch {
      alert('Export failed. Please try again.')
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-xl sm:text-2xl font-bold">Admin Settings</h2>
      
      <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
        <Card className="hover-lift">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Platform Settings
            </CardTitle>
            <CardDescription>Configure platform-wide settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded bg-muted/20">
              <div className="flex-1">
                <h4 className="font-medium">Maintenance Mode</h4>
                <p className="text-sm text-muted-foreground">Temporarily disable the platform</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={maintenanceMode ? 'destructive' : 'outline'}>
                  {maintenanceMode ? 'Enabled' : 'Disabled'}
                </Badge>
                <Button 
                  onClick={toggleMaintenanceMode}
                  variant={maintenanceMode ? 'destructive' : 'outline'}
                  size="sm"
                >
                  {maintenanceMode ? 'Disable' : 'Enable'}
                </Button>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded bg-muted/20">
              <div className="flex-1">
                <h4 className="font-medium">User Registration</h4>
                <p className="text-sm text-muted-foreground">College email verification required</p>
              </div>
              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-400/20 w-fit">
                Active
              </Badge>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded bg-muted/20">
              <div className="flex-1">
                <h4 className="font-medium">Platform Commission</h4>
                <p className="text-sm text-muted-foreground">Fee on successful transactions</p>
              </div>
              <Badge variant="outline" className="w-fit">
                5%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Status
            </CardTitle>
            <CardDescription>Current security configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded bg-muted/20">
              <div className="flex-1">
                <h4 className="font-medium">Rate Limiting</h4>
                <p className="text-sm text-muted-foreground">API request protection</p>
              </div>
              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-400/20 w-fit">
                Active
              </Badge>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded bg-muted/20">
              <div className="flex-1">
                <h4 className="font-medium">HTTPS Encryption</h4>
                <p className="text-sm text-muted-foreground">All traffic encrypted</p>
              </div>
              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-400/20 w-fit">
                Enabled
              </Badge>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded bg-muted/20">
              <div className="flex-1">
                <h4 className="font-medium">Input Validation</h4>
                <p className="text-sm text-muted-foreground">XSS & SQL injection protection</p>
              </div>
              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-400/20 w-fit">
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Status
            </CardTitle>
            <CardDescription>System notification channels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded bg-muted/20">
              <div className="flex-1">
                <h4 className="font-medium">In-App Notifications</h4>
                <p className="text-sm text-muted-foreground">Real-time user alerts</p>
              </div>
              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-400/20 w-fit">
                Active
              </Badge>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded bg-muted/20">
              <div className="flex-1">
                <h4 className="font-medium">Email Notifications</h4>
                <p className="text-sm text-muted-foreground">Transaction & verification emails</p>
              </div>
              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-400/20 w-fit">
                Active
              </Badge>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded bg-muted/20">
              <div className="flex-1">
                <h4 className="font-medium">Push Notifications</h4>
                <p className="text-sm text-muted-foreground">PWA browser notifications</p>
              </div>
              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-400/20 w-fit">
                Supported
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Management
            </CardTitle>
            <CardDescription>Backup and export options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => handleExport('users')}
              disabled={exporting === 'users'}
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting === 'users' ? 'Exporting...' : 'Export User Data'}
            </Button>
            
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => handleExport('transactions')}
              disabled={exporting === 'transactions'}
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting === 'transactions' ? 'Exporting...' : 'Export Transaction Data'}
            </Button>
            
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => handleExport('backup')}
              disabled={exporting === 'backup'}
            >
              <Database className="h-4 w-4 mr-2" />
              {exporting === 'backup' ? 'Creating...' : 'Create System Backup'}
            </Button>
            
            {lastBackup && (
              <p className="text-xs text-muted-foreground text-center">
                Last backup: {lastBackup}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}