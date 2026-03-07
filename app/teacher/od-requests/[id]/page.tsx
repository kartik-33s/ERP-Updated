import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileCheck, User, Calendar, FileText, ExternalLink } from "lucide-react"
import { ApprovalActions } from "@/components/approval-actions"

export default async function ODRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: request, error } = await supabase
    .from("od_requests")
    .select("*, profiles!od_requests_student_id_fkey(full_name, email, student_id, department)")
    .eq("id", id)
    .single()

  if (error || !request) {
    notFound()
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "approved":
        return <Badge className="bg-accent text-accent-foreground text-sm px-3 py-1">Approved</Badge>
      case "rejected":
        return <Badge variant="destructive" className="text-sm px-3 py-1">Rejected</Badge>
      default:
        return <Badge variant="secondary" className="text-sm px-3 py-1">Pending Review</Badge>
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">OD Request Details</h1>
          <p className="text-muted-foreground mt-1">Review and take action on this request</p>
        </div>
        {getStatusBadge(request.status)}
      </div>

      {/* Student Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" />
            Student Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="font-medium text-foreground">{request.profiles?.full_name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Student ID</p>
            <p className="font-medium text-foreground">{request.profiles?.student_id || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium text-foreground">{request.profiles?.email}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Department</p>
            <p className="font-medium text-foreground">{request.profiles?.department || "N/A"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Event Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
            Event Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Event Name</p>
            <p className="font-medium text-foreground text-lg">{request.event_name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Event Date</p>
            <p className="font-medium text-foreground">
              {new Date(request.event_date).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Reason for Absence</p>
            <p className="font-medium text-foreground whitespace-pre-wrap">{request.reason}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Submitted On</p>
            <p className="font-medium text-foreground">
              {new Date(request.created_at).toLocaleDateString("en-US", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Supporting Document */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            Supporting Document
          </CardTitle>
          <CardDescription>Certificate, invitation letter, or registration proof</CardDescription>
        </CardHeader>
        <CardContent>
          {request.proof_pathname ? (
            <div className="border rounded-lg p-4 bg-muted/30">
              <a
                href={`/api/file?pathname=${encodeURIComponent(request.proof_pathname)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline font-medium"
              >
                <ExternalLink className="h-4 w-4" />
                View Uploaded Document
              </a>
              <p className="text-xs text-muted-foreground mt-2">
                Opens in a new tab. Make sure to verify the document authenticity.
              </p>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/30">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No document uploaded</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rejection Reason (if rejected) */}
      {request.status === "rejected" && request.rejection_reason && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-lg text-destructive">Rejection Reason</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground">{request.rejection_reason}</p>
          </CardContent>
        </Card>
      )}

      {/* Approval Actions */}
      {request.status === "pending" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileCheck className="h-5 w-5" />
              Take Action
            </CardTitle>
            <CardDescription>
              Approve to mark student present for {new Date(request.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}, or reject with a reason
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ApprovalActions 
              requestId={request.id} 
              studentId={request.student_id}
              eventDate={request.event_date}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
