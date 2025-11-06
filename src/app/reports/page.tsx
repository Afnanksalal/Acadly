import { createServerSupabaseClient } from "@/lib/supabase-server"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Flag, Clock, Eye, CheckCircle, XCircle } from "lucide-react"

export default async function ReportsPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user's reports
  const reports = await prisma.report.findMany({
    where: {
      reporterId: user.id
    },
    include: {
      reportedUser: {
        select: {
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  })

  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === "PENDING").length,
    investigating: reports.filter(r => r.status === "INVESTIGATING").length,
    resolved: reports.filter(r => r.status === "RESOLVED").length
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING": return <Clock className="h-4 w-4" />
      case "INVESTIGATING": return <Eye className="h-4 w-4" />
      case "RESOLVED": return <CheckCircle className="h-4 w-4" />
      case "DISMISSED": return <XCircle className="h-4 w-4" />
      default: return <Flag className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
      case "INVESTIGATING": return "bg-blue-500/10 text-blue-400 border-blue-500/20"
      case "RESOLVED": return "bg-green-500/10 text-green-400 border-green-500/20"
      case "DISMISSED": return "bg-red-500/10 text-red-400 border-red-500/20"
      case "ESCALATED": return "bg-purple-500/10 text-purple-400 border-purple-500/20"
      default: return "bg-muted/20 text-muted-foreground border-muted/20"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL": return "destructive"
      case "HIGH": return "destructive"
      case "MEDIUM": return "secondary"
      case "LOW": return "outline"
      default: return "outline"
    }
  }

  return (
    <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">My Reports</h1>
        <p className="text-muted-foreground mt-2">
          Track your submitted reports and their status
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Reports</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-400">{stats.investigating}</div>
            <div className="text-sm text-muted-foreground">Investigating</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">{stats.resolved}</div>
            <div className="text-sm text-muted-foreground">Resolved</div>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {reports.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Flag className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Reports</h3>
              <p className="text-muted-foreground">
                You haven&apos;t submitted any reports yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          reports.map((report) => (
            <Card key={report.id} className="hover-lift">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg mb-2">
                      {report.targetType} Report
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Reason: {report.reason.replace(/_/g, " ")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={getStatusColor(report.status)}>
                      {getStatusIcon(report.status)}
                      <span className="ml-1">{report.status}</span>
                    </Badge>
                    <Badge variant={getPriorityColor(report.priority)}>
                      {report.priority}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {report.description && (
                  <div>
                    <p className="text-sm font-medium mb-1">Description:</p>
                    <p className="text-sm text-muted-foreground">
                      {report.description}
                    </p>
                  </div>
                )}

                {report.reportedUser && (
                  <div>
                    <p className="text-sm font-medium mb-1">Reported User:</p>
                    <p className="text-sm text-muted-foreground">
                      {report.reportedUser.name || report.reportedUser.email}
                    </p>
                  </div>
                )}

                {report.resolution && (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="text-sm font-medium text-green-400 mb-1">Resolution:</p>
                    <p className="text-sm text-green-400/80">{report.resolution}</p>
                  </div>
                )}

                <div className="text-xs text-muted-foreground pt-3 border-t">
                  Submitted on {new Date(report.createdAt).toLocaleDateString()} at{" "}
                  {new Date(report.createdAt).toLocaleTimeString()}
                  {report.resolvedAt && (
                    <span className="block sm:inline sm:ml-2">
                      • Resolved on {new Date(report.resolvedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </main>
  )
}
