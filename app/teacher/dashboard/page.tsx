import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Users, FileCheck, Clock, CheckCircle, XCircle } from "lucide-react"

export default async function TeacherDashboard() {
  const supabase = await createClient()

  // Fetch all OD requests with student info
  const { data: odRequests } = await supabase
    .from("od_requests")
    .select("*, profiles!od_requests_student_id_fkey(full_name, student_id, department)")
    .order("created_at", { ascending: false })
    .limit(10)

  // Fetch student count
  const { count: studentCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "student")

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
          <h1 className="text-3xl font-bold text-foreground">Teacher Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage OD requests and student attendance</p>
        </div>
        <Button asChild>
          <Link href="/teacher/od-requests">
            View All Requests
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Students</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              {studentCount || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-2">
            <CardDescription className="text-amber-700">Pending Requests</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2 text-amber-700">
              <Clock className="h-6 w-6" />
              {pendingRequests}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Approved</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2 text-accent">
              <CheckCircle className="h-6 w-6" />
              {approvedRequests}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Rejected</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2 text-destructive">
              <XCircle className="h-6 w-6" />
              {rejectedRequests}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Recent OD Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Recent OD Requests
          </CardTitle>
          <CardDescription>Latest On Duty requests from students</CardDescription>
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
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{request.profiles?.full_name}</span>
                      {request.profiles?.student_id && (
                        <span>ID: {request.profiles.student_id}</span>
                      )}
                      <span>
                        {new Date(request.event_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(request.status)}
                    {request.status === "pending" && (
                      <Button asChild size="sm">
                        <Link href={`/teacher/od-requests/${request.id}`}>Review</Link>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No OD requests yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
