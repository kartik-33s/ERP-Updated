import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { FileText, CheckCircle, XCircle, Clock, Plus } from "lucide-react"

export default async function StudentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch OD requests
  const { data: odRequests } = await supabase
    .from("od_requests")
    .select("*")
    .eq("student_id", user?.id)
    .order("created_at", { ascending: false })
    .limit(5)

  // Fetch attendance stats
  const { data: attendance } = await supabase
    .from("attendance")
    .select("status")
    .eq("student_id", user?.id)

  const totalDays = attendance?.length || 0
  const presentDays = attendance?.filter(a => a.status === "present" || a.status === "od").length || 0
  const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0

  const pendingRequests = odRequests?.filter(r => r.status === "pending").length || 0
  const approvedRequests = odRequests?.filter(r => r.status === "approved").length || 0
  const rejectedRequests = odRequests?.filter(r => r.status === "rejected").length || 0

  function getStatusBadge(status: string) {
    switch (status) {
      case "approved":
        return <Badge className="bg-accent text-accent-foreground">Approved</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="secondary">Pending</Badge>
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your attendance and OD requests</p>
        </div>
        <Button asChild>
          <Link href="/student/od-request">
            <Plus className="h-4 w-4 mr-2" />
            New OD Request
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Attendance</CardDescription>
            <CardTitle className="text-3xl">{attendancePercentage}%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{presentDays} of {totalDays} days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Requests</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Clock className="h-6 w-6 text-muted-foreground" />
              {pendingRequests}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Approved</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-accent" />
              {approvedRequests}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Rejected</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <XCircle className="h-6 w-6 text-destructive" />
              {rejectedRequests}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Recent OD Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent OD Requests
          </CardTitle>
          <CardDescription>Your latest On Duty request submissions</CardDescription>
        </CardHeader>
        <CardContent>
          {odRequests && odRequests.length > 0 ? (
            <div className="space-y-4">
              {odRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-muted/30"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{request.event_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(request.event_date).toLocaleDateString("en-US", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(request.status)}
                    {request.status === "rejected" && request.rejection_reason && (
                      <p className="text-sm text-destructive max-w-48 truncate" title={request.rejection_reason}>
                        {request.rejection_reason}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No OD requests yet</p>
              <Button asChild variant="link" className="mt-2">
                <Link href="/student/od-request">Submit your first request</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
