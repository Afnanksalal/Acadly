"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Shield, Eye } from "lucide-react"

interface ReportData {
  id: string
  targetType: string
  targetId: string
  reason: string
  description: string | null
  status: string
  priority: string
  createdAt: string
  reporter: {
    email: string
    name: string | null
  }
  reportedUser?: {
    id: string
    email: string
    name: string | null
  }
}

interface ReportResolutionDialogProps {
  report: ReportData | null
  open: boolean
  onClose: () => void
  onResolved: () => void
}

export function ReportResolutionDialog({
  report,
  open,
  onClose,
  onResolved
}: ReportResolutionDialogProps) {
  const [action, setAction] = useState<'RESOLVED' | 'DISMISSED' | 'ESCALATED'>('RESOLVED')
  const [resolution, setResolution] = useState('')
  const [contentAction, setContentAction] = useState<'NONE' | 'HIDE' | 'DELETE'>('NONE')
  const [userAction, setUserAction] = useState<'NONE' | 'WARNING' | 'SUSPEND' | 'BAN'>('NONE')
  const [suspendDays, setSuspendDays] = useState('7')
  const [notifyUser, setNotifyUser] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!report) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!resolution.trim()) {
      setError('Resolution notes are required')
      return
    }

    setLoading(true)
    setError('')

    try {
      const reportResponse = await fetch(`/api/admin/reports/${report.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: action,
          resolution,
          contentAction,
          userAction,
          suspendDays: userAction === 'SUSPEND' ? parseInt(suspendDays) : undefined,
          notifyUser
        })
      })

      if (!reportResponse.ok) {
        throw new Error('Failed to update report')
      }

      onResolved()
      onClose()
      setResolution('')
      setContentAction('NONE')
      setUserAction('NONE')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Resolve Report</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Report Details */}
          <div className="p-4 bg-muted/30 rounded-lg space-y-3 border">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant="outline" className="text-xs">{report.targetType}</Badge>
              <Badge variant={report.priority === 'HIGH' || report.priority === 'URGENT' ? 'destructive' : 'secondary'}>
                {report.priority}
              </Badge>
              <Badge variant="outline">{report.status}</Badge>
            </div>
            
            <div>
              <Label className="text-xs font-semibold text-muted-foreground">Reason</Label>
              <p className="text-sm font-medium">{report.reason.replace(/_/g, ' ')}</p>
            </div>
            
            {report.description && (
              <div>
                <Label className="text-xs font-semibold text-muted-foreground">Description</Label>
                <p className="text-sm bg-background/50 p-3 rounded border">{report.description}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <Label className="text-xs font-semibold text-muted-foreground">Reported By</Label>
                <p className="text-sm font-medium">{report.reporter.name || report.reporter.email}</p>
              </div>
              {report.reportedUser && (
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground">Reported User</Label>
                  <p className="text-sm font-medium">{report.reportedUser.name || report.reportedUser.email}</p>
                </div>
              )}
            </div>
            
            <div className="pt-2 border-t">
              <Label className="text-xs font-semibold text-muted-foreground">Reported At</Label>
              <p className="text-xs">
                {new Date(report.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Resolution Action */}
          <div className="space-y-2">
            <Label htmlFor="action">Resolution Action *</Label>
            <Select
              id="action"
              value={action}
              onChange={(e) => setAction(e.target.value as any)}
              required
            >
              <option value="RESOLVED">Resolve - Take Action</option>
              <option value="DISMISSED">Dismiss - No Violation Found</option>
              <option value="ESCALATED">Escalate - Needs Senior Review</option>
            </Select>
          </div>

          {/* Content & User Actions */}
          {action === 'RESOLVED' && (
            <div className="space-y-4">
              {/* Content Moderation */}
              <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-lg space-y-4">
                <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                  <Eye className="h-5 w-5" />
                  <h4 className="font-semibold">Content Moderation</h4>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contentAction">Action on Reported Content</Label>
                  <Select
                    id="contentAction"
                    value={contentAction}
                    onChange={(e) => setContentAction(e.target.value as any)}
                  >
                    <option value="NONE">No Action - Content is Fine</option>
                    <option value="HIDE">Hide Content - Make Invisible</option>
                    <option value="DELETE">Delete Content - Permanent Removal</option>
                  </Select>
                </div>
              </div>

              {/* User Actions */}
              <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg space-y-4">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <Shield className="h-5 w-5" />
                  <h4 className="font-semibold">User Moderation</h4>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="userAction">Action on Reported User</Label>
                  <Select
                    id="userAction"
                    value={userAction}
                    onChange={(e) => setUserAction(e.target.value as any)}
                  >
                    <option value="NONE">No Action - User is Fine</option>
                    <option value="WARNING">Send Warning - Email Notification</option>
                    <option value="SUSPEND">Suspend Account - Temporary Ban</option>
                    <option value="BAN">Permanent Ban - Account Disabled</option>
                  </Select>
                </div>

                {userAction === 'SUSPEND' && (
                  <div className="space-y-2">
                    <Label htmlFor="suspendDays">Suspension Duration</Label>
                    <Select
                      id="suspendDays"
                      value={suspendDays}
                      onChange={(e) => setSuspendDays(e.target.value)}
                    >
                      <option value="1">1 Day</option>
                      <option value="3">3 Days</option>
                      <option value="7">1 Week</option>
                      <option value="14">2 Weeks</option>
                      <option value="30">1 Month</option>
                      <option value="90">3 Months</option>
                    </Select>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="notifyUser"
                    checked={notifyUser}
                    onChange={(e) => setNotifyUser(e.target.checked)}
                    className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                  />
                  <Label htmlFor="notifyUser" className="text-sm cursor-pointer">
                    Send notification to user about this action
                  </Label>
                </div>
              </div>
            </div>
          )}

          {/* Resolution Notes */}
          <div className="space-y-2">
            <Label htmlFor="resolution">Resolution Notes *</Label>
            <Textarea
              id="resolution"
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="Provide detailed resolution notes explaining your decision and any actions taken."
              rows={6}
              required
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground">
              {resolution.length}/2000 characters
            </p>
          </div>

          {/* Action Summary */}
          <div className={`p-4 rounded-lg border ${
            action === 'RESOLVED' ? 'bg-green-500/5 border-green-500/20' :
            action === 'DISMISSED' ? 'bg-red-500/5 border-red-500/20' :
            'bg-yellow-500/5 border-yellow-500/20'
          }`}>
            <h4 className="font-semibold mb-3">Action Summary</h4>
            <ul className="text-sm space-y-1.5">
              {action === 'RESOLVED' && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Report will be marked as <strong>RESOLVED</strong></span>
                  </li>
                  {contentAction !== 'NONE' && (
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>Content will be <strong>{contentAction.toLowerCase()}d</strong></span>
                    </li>
                  )}
                  {userAction !== 'NONE' && (
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>User will receive <strong>{userAction.toLowerCase()}</strong>
                        {userAction === 'SUSPEND' && ` for ${suspendDays} days`}
                      </span>
                    </li>
                  )}
                  {notifyUser && (
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>User will be notified of actions</span>
                    </li>
                  )}
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Reporter will be notified of resolution</span>
                  </li>
                </>
              )}
              {action === 'DISMISSED' && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">✓</span>
                    <span>Report will be marked as <strong>DISMISSED</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">✓</span>
                    <span>No action will be taken</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">✓</span>
                    <span>Reporter will be notified</span>
                  </li>
                </>
              )}
              {action === 'ESCALATED' && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-0.5">✓</span>
                    <span>Report will be marked as <strong>ESCALATED</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-0.5">✓</span>
                    <span>Senior moderators will be notified</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-0.5">✓</span>
                    <span>Report priority will be increased</span>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className={`flex-1 ${
                action === 'RESOLVED' ? 'bg-green-600 hover:bg-green-700' :
                action === 'DISMISSED' ? 'bg-red-600 hover:bg-red-700' :
                'bg-yellow-600 hover:bg-yellow-700'
              }`}
            >
              {loading ? 'Processing...' : 
               action === 'RESOLVED' ? 'Resolve Report' :
               action === 'DISMISSED' ? 'Dismiss Report' :
               'Escalate Report'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="sm:w-auto"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
