"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { NativeSelect } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertCircle, DollarSign, Eye, FileText } from "lucide-react"
import { Input } from "@/components/ui/input"

interface DisputeData {
  id: string
  subject: string
  description: string
  reason: string
  status: string
  priority: string
  createdAt: string
  evidence?: any
  transaction: {
    id: string
    amount: number
    listing: {
      title: string
      price: number
    }
    buyer: {
      email: string
      name: string | null
    }
    seller: {
      email: string
      name: string | null
    }
  }
}

interface DisputeResolutionDialogProps {
  dispute: DisputeData | null
  open: boolean
  onClose: () => void
  onResolved: () => void
}

export function DisputeResolutionDialog({
  dispute,
  open,
  onClose,
  onResolved
}: DisputeResolutionDialogProps) {
  const [action, setAction] = useState<'RESOLVED' | 'REJECTED' | 'IN_REVIEW'>('IN_REVIEW')
  const [resolution, setResolution] = useState('')
  const [refundAmount, setRefundAmount] = useState('')
  const [refundPercentage, setRefundPercentage] = useState('100')
  const [notifyBuyer, setNotifyBuyer] = useState(true)
  const [notifySeller, setNotifySeller] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!dispute) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!resolution.trim()) {
      setError('Resolution notes are required')
      return
    }

    if (action === 'RESOLVED' && !refundAmount && refundPercentage === '0') {
      setError('Please specify refund amount or percentage')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Update dispute status
      const disputeResponse = await fetch(`/api/admin/disputes/${dispute.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: action,
          resolution,
          refundAmount: action === 'RESOLVED' ? (refundAmount ? parseFloat(refundAmount) : 
            (Number(dispute.transaction.amount) * parseFloat(refundPercentage) / 100)) : undefined,
          notifyBuyer,
          notifySeller
        })
      })

      if (!disputeResponse.ok) {
        const errorData = await disputeResponse.json()
        throw new Error(errorData.error || 'Failed to update dispute')
      }

      onResolved()
      onClose()
      // Reset form
      setResolution('')
      setRefundAmount('')
      setRefundPercentage('100')
      setAction('IN_REVIEW')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process dispute')
    } finally {
      setLoading(false)
    }
  }

  const calculateRefundAmount = () => {
    if (refundPercentage) {
      return (Number(dispute.transaction.amount) * parseFloat(refundPercentage) / 100).toFixed(2)
    }
    return refundAmount || '0'
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Resolve Dispute #{dispute.id.slice(0, 8)}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Dispute Details */}
          <div className="p-4 bg-muted/30 rounded-lg space-y-3 border">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="text-xs">TRANSACTION DISPUTE</Badge>
              <Badge variant={dispute.priority === 'HIGH' || dispute.priority === 'URGENT' ? 'destructive' : 'secondary'}>
                {dispute.priority}
              </Badge>
              <Badge variant="outline">{dispute.status}</Badge>
            </div>

            <div>
              <Label className="text-xs font-semibold text-muted-foreground">Subject</Label>
              <p className="text-sm font-medium">{dispute.subject}</p>
            </div>
            
            <div>
              <Label className="text-xs font-semibold text-muted-foreground">Reason</Label>
              <p className="text-sm">{dispute.reason.replace(/_/g, ' ')}</p>
            </div>
            
            <div>
              <Label className="text-xs font-semibold text-muted-foreground">Description</Label>
              <p className="text-sm bg-background/50 p-3 rounded border">{dispute.description}</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <Label className="text-xs font-semibold text-muted-foreground">Transaction Amount</Label>
                <p className="text-2xl font-bold text-primary">₹{Number(dispute.transaction.amount).toFixed(2)}</p>
              </div>
              <div>
                <Label className="text-xs font-semibold text-muted-foreground">Item</Label>
                <p className="text-sm font-medium">{dispute.transaction.listing.title}</p>
                <p className="text-xs text-muted-foreground">Listed at ₹{Number(dispute.transaction.listing.price).toFixed(2)}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <Label className="text-xs font-semibold text-muted-foreground">Buyer (Dispute Filer)</Label>
                <p className="text-sm font-medium">{dispute.transaction.buyer.name || dispute.transaction.buyer.email}</p>
              </div>
              <div>
                <Label className="text-xs font-semibold text-muted-foreground">Seller</Label>
                <p className="text-sm font-medium">{dispute.transaction.seller.name || dispute.transaction.seller.email}</p>
              </div>
            </div>

            {dispute.evidence && (
              <div className="pt-2 border-t">
                <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Evidence Submitted
                </Label>
                <pre className="text-xs bg-background/50 p-3 rounded border overflow-auto max-h-32 mt-1">
                  {JSON.stringify(dispute.evidence, null, 2)}
                </pre>
              </div>
            )}

            <div className="pt-2 border-t">
              <Label className="text-xs font-semibold text-muted-foreground">Filed At</Label>
              <p className="text-xs">{new Date(dispute.createdAt).toLocaleString()}</p>
            </div>
          </div>

          {/* Resolution Action */}
          <div className="space-y-2">
            <Label htmlFor="action" className="text-sm font-semibold">Resolution Decision *</Label>
            <NativeSelect
              id="action"
              value={action}
              onChange={(e) => setAction(e.target.value as any)}
              required
            >
              <option value="IN_REVIEW">Mark as In Review - Need More Time</option>
              <option value="RESOLVED">Resolve - Favor Buyer (Issue Refund)</option>
              <option value="REJECTED">Reject - Favor Seller (No Refund)</option>
            </NativeSelect>
          </div>

          {/* Refund Options - Only show when resolving */}
          {action === 'RESOLVED' && (
            <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-lg space-y-4">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <DollarSign className="h-5 w-5" />
                <h4 className="font-semibold">Refund Configuration</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="refundPercentage" className="text-sm">Refund Percentage</Label>
                  <NativeSelect
                    id="refundPercentage"
                    value={refundPercentage}
                    onChange={(e) => {
                      setRefundPercentage(e.target.value)
                      if (e.target.value !== '0') setRefundAmount('')
                    }}
                  >
                    <option value="100">100% - Full Refund</option>
                    <option value="75">75% - Partial Refund</option>
                    <option value="50">50% - Half Refund</option>
                    <option value="25">25% - Quarter Refund</option>
                    <option value="0">Custom Amount</option>
                  </NativeSelect>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="refundAmount" className="text-sm">Or Custom Amount (₹)</Label>
                  <Input
                    id="refundAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    max={Number(dispute.transaction.amount)}
                    value={refundAmount}
                    onChange={(e) => {
                      setRefundAmount(e.target.value)
                      setRefundPercentage('0')
                    }}
                    placeholder="Enter amount"
                    disabled={refundPercentage !== '0'}
                  />
                </div>
              </div>

              <div className="p-3 bg-background/50 rounded border border-green-500/20">
                <p className="text-sm font-medium">Refund Amount: ₹{calculateRefundAmount()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  ⚠️ This amount will be refunded to the buyer&apos;s payment method
                </p>
              </div>
            </div>
          )}

          {/* Resolution Notes */}
          <div className="space-y-2">
            <Label htmlFor="resolution" className="text-sm font-semibold">
              Resolution Notes *
              <span className="text-xs font-normal text-muted-foreground ml-2">
                (Visible to both buyer and seller)
              </span>
            </Label>
            <Textarea
              id="resolution"
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="Provide detailed resolution notes explaining your decision. Be professional and clear about why you're ruling in favor of one party."
              rows={6}
              required
              maxLength={2000}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {resolution.length}/2000 characters
            </p>
          </div>

          {/* Notification Settings */}
          <div className="space-y-3 p-3 bg-muted/20 rounded border">
            <Label className="text-sm font-semibold">Notification Settings</Label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="notifyBuyer"
                checked={notifyBuyer}
                onChange={(e) => setNotifyBuyer(e.target.checked)}
                className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
              />
              <Label htmlFor="notifyBuyer" className="text-sm font-normal cursor-pointer">
                Send resolution notification to buyer
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="notifySeller"
                checked={notifySeller}
                onChange={(e) => setNotifySeller(e.target.checked)}
                className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
              />
              <Label htmlFor="notifySeller" className="text-sm font-normal cursor-pointer">
                Send resolution notification to seller
              </Label>
            </div>
          </div>

          {/* Action Summary */}
          <div className={`p-4 rounded-lg border ${
            action === 'RESOLVED' ? 'bg-green-500/5 border-green-500/20' :
            action === 'REJECTED' ? 'bg-red-500/5 border-red-500/20' :
            'bg-blue-500/5 border-blue-500/20'
          }`}>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              {action === 'RESOLVED' && <CheckCircle className="h-4 w-4 text-green-500" />}
              {action === 'REJECTED' && <XCircle className="h-4 w-4 text-red-500" />}
              {action === 'IN_REVIEW' && <Eye className="h-4 w-4 text-blue-500" />}
              Action Summary
            </h4>
            <ul className="text-sm space-y-1.5">
              {action === 'RESOLVED' && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Dispute will be marked as <strong>RESOLVED</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Refund of <strong>₹{calculateRefundAmount()}</strong> will be processed</span>
                  </li>
                  {notifyBuyer && (
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>Buyer will receive refund confirmation</span>
                    </li>
                  )}
                  {notifySeller && (
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>Seller will be notified of resolution</span>
                    </li>
                  )}
                </>
              )}
              {action === 'REJECTED' && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">✓</span>
                    <span>Dispute will be marked as <strong>REJECTED</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">✓</span>
                    <span>No refund will be issued</span>
                  </li>
                  {notifyBuyer && (
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-0.5">✓</span>
                      <span>Buyer will be notified of decision</span>
                    </li>
                  )}
                  {notifySeller && (
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-0.5">✓</span>
                      <span>Seller will be notified</span>
                    </li>
                  )}
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">✓</span>
                    <span>Transaction remains completed</span>
                  </li>
                </>
              )}
              {action === 'IN_REVIEW' && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">✓</span>
                    <span>Dispute will be marked as <strong>IN_REVIEW</strong></span>
                  </li>
                  {(notifyBuyer || notifySeller) && (
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">✓</span>
                      <span>Parties will be notified of review status</span>
                    </li>
                  )}
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">✓</span>
                    <span>You can resolve it later with more information</span>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="submit"
              disabled={loading}
              className={`flex-1 ${
                action === 'RESOLVED' ? 'bg-green-600 hover:bg-green-700' :
                action === 'REJECTED' ? 'bg-red-600 hover:bg-red-700' :
                'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Processing...' : 
               action === 'RESOLVED' ? 'Resolve & Issue Refund' :
               action === 'REJECTED' ? 'Reject Dispute' :
               'Mark In Review'}
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
