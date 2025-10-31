'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Settings, Shield, Bell, Download, AlertTriangle } from 'lucide-react'

export function AdminSettings() {
  const [maintenanceMode, setMaintenanceMode] = useState(false)

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
    } catch (error) {
      console.error('Failed to toggle maintenance mode:', error)
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
                <p className="text-sm text-muted-foreground">Allow new user signups</p>
              </div>
              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-400/20 w-fit">
                Enabled
              </Badge>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded bg-muted/20">
              <div className="flex-1">
                <h4 className="font-medium">Email Verification</h4>
                <p className="text-sm text-muted-foreground">Require email verification for new users</p>
              </div>
              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-400/20 w-fit">
                Required
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Settings
            </CardTitle>
            <CardDescription>Manage security and access controls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded bg-muted/20">
              <div className="flex-1">
                <h4 className="font-medium">Two-Factor Authentication</h4>
                <p className="text-sm text-muted-foreground">Require 2FA for admin accounts</p>
              </div>
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-400/20 w-fit">
                Recommended
              </Badge>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded bg-muted/20">
              <div className="flex-1">
                <h4 className="font-medium">Session Timeout</h4>
                <p className="text-sm text-muted-foreground">Auto-logout after inactivity</p>
              </div>
              <Badge variant="outline" className="w-fit">
                30 minutes
              </Badge>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded bg-muted/20">
              <div className="flex-1">
                <h4 className="font-medium">Rate Limiting</h4>
                <p className="text-sm text-muted-foreground">API request rate limits</p>
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
              Notification Settings
            </CardTitle>
            <CardDescription>Configure system notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded bg-muted/20">
              <div className="flex-1">
                <h4 className="font-medium">Email Notifications</h4>
                <p className="text-sm text-muted-foreground">Send email alerts to admins</p>
              </div>
              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-400/20 w-fit">
                Enabled
              </Badge>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded bg-muted/20">
              <div className="flex-1">
                <h4 className="font-medium">Slack Integration</h4>
                <p className="text-sm text-muted-foreground">Send alerts to Slack channel</p>
              </div>
              <Badge variant="outline" className="w-fit">
                Not Configured
              </Badge>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded bg-muted/20">
              <div className="flex-1">
                <h4 className="font-medium">SMS Alerts</h4>
                <p className="text-sm text-muted-foreground">Critical system alerts via SMS</p>
              </div>
              <Badge variant="outline" className="w-fit">
                Disabled
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Data Management
            </CardTitle>
            <CardDescription>Backup and export options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
            <Button className="w-full" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export User Data
            </Button>
            
            <Button className="w-full" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Transaction Data
            </Button>
            
            <Button className="w-full" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Create System Backup
            </Button>
            
            <div className="flex items-center gap-2 p-3 bg-yellow-500/10 text-yellow-400 border border-yellow-400/20 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              <p className="text-sm">
                Last backup: 2 days ago
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}