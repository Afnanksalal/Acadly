import { createServerSupabaseClient } from "@/lib/supabase-server"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AlertTriangle, Clock, CheckCircle, XCircle, Eye } from "lucide-react"

export default async function DisputesPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user's disputes
  const disputes = await prisma.dispute.findMany({
    where: {
      reporterId: user.id
    },
    include: {
      transaction: {
        include: {
          listing: {
            select: {
              title: true,
              price: true
            }
          },
          buyer: {
            select: {
              name: true,
              email: true
            }
          },
          seller: {
            select: {
              name: true,
              email: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  })

  const stats = {
    total: disputes.length,
    open: disputes.filter(d => d.status === "OPEN").length,
    inReview: disputes.filter(d => d.status === "IN_REVIEW").length,
    resolved: disputes.filter(d => d.status === "RESOLVED").length
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "OPEN": return <Clock className="h-4 w-4" />
      case "IN_REVIEW": return <Eye className="h-4 w-4" />
      case "RESOLVED": return <CheckCircle className="h-4 w-4" />
      case "REJECTED": return <XCircle className="h-4 w-4" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
      case "IN_REVIEW": return "bg-blue-500/10 text-blue-400 border-blue-500/20"
      case "RESOLVED": return "bg-green-500/10 text-green-400 border-green-500/20"
      case "REJECTED": return "bg-red-500/10 text-red-400 border-red-500/20"
      default: return "bg-muted/20 text-muted-foreground border-muted/20"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT": return "destructive"
      case "HIGH": return "destructive"
      case "MEDIUM": return "secondary"
      case "LOW": return "outline"
      default: return "outline"
    }
  }

  return (
    <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">My Disputes</h1>
        <p className="text-muted-foreground mt-2">
          Track and manage your transaction disputes
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Disputes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-400">{stats.open}</div>
            <div className="text-sm text-muted-foreground">Open</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-400">{stats.inReview}</div>
            <div className="text-sm text-muted-foreground">In Review</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">{stats.resolved}</div>
            <div className="text-sm text-muted-foreground">Resolved</div>
          </CardContent>
        </Card>
      </div>

      {/* Disputes List */}
      <div className="space-y-4">
        {disputes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Disputes</h3>
              <p className="text-muted-foreground mb-6">
                You haven&apos;t filed any disputes yet. We hope your transactions go smoothly!
              </p>
              <Link href="/orders">
                <Button>View Orders</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          disputes.map((dispute) => (
            <Card key={dispute.id} className="hover-lift">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg mb-2">{dispute.subject}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Transaction: {dispute.transaction.listing.title}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={getStatusColor(dispute.status)}>
                      {getStatusIcon(dispute.status)}
                      <span className="ml-1">{dispute.status.replace("_", " ")}</span>
                    </Badge>
                    <Badge variant={getPriorityColor(dispute.priority)}>
                      {dispute.priority}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">Reason:</p>
                  <p className="text-sm text-muted-foreground">
                    {dispute.reason.replace(/_/g, " ")}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium mb-1">Description:</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {dispute.description}
                  </p>
                </div>

                {dispute.resolution && (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="text-sm font-medium text-green-400 mb-1">Resolution:</p>
                    <p className="text-sm text-green-400/80">{dispute.resolution}</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t">
                  <div className="text-xs text-muted-foreground">
                    Filed on {new Date(dispute.createdAt).toLocaleDateString()} at{" "}
                    {new Date(dispute.createdAt).toLocaleTimeString()}
                    {dispute.resolvedAt && (
                      <span className="block sm:inline sm:ml-2">
                        • Resolved on {new Date(dispute.resolvedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <Link href={`/transactions/${dispute.transactionId}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Transaction
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </main>
  )
}
