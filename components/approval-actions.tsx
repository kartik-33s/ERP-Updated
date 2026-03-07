"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

interface ApprovalActionsProps {
  requestId: string
  studentId: string
  eventDate: string
}

export function ApprovalActions({ requestId, studentId, eventDate }: ApprovalActionsProps) {
  const [rejectionReason, setRejectionReason] = useState("")
  const [showRejectionForm, setShowRejectionForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [action, setAction] = useState<"approve" | "reject" | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleApprove() {
    setLoading(true)
    setAction("approve")

    try {
      const { data: { user } } = await supabase.auth.getUser()

      // Update OD request status
      const { error: updateError } = await supabase
        .from("od_requests")
        .update({
          status: "approved",
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", requestId)

      if (updateError) throw updateError

      // Create attendance record marking student present (OD)
      const { error: attendanceError } = await supabase
        .from("attendance")
        .upsert({
          student_id: studentId,
          date: eventDate,
          status: "od",
          od_request_id: requestId,
          marked_by: user?.id,
        }, {
          onConflict: "student_id,date"
        })

      if (attendanceError) throw attendanceError

      router.push("/teacher/od-requests")
      router.refresh()
    } catch (error) {
      console.error("Error approving request:", error)
      alert("Failed to approve request. Please try again.")
    } finally {
      setLoading(false)
      setAction(null)
    }
  }

  async function handleReject() {
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for rejection")
      return
    }

    setLoading(true)
    setAction("reject")

    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from("od_requests")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", requestId)

      if (error) throw error

      router.push("/teacher/od-requests")
      router.refresh()
    } catch (error) {
      console.error("Error rejecting request:", error)
      alert("Failed to reject request. Please try again.")
    } finally {
      setLoading(false)
      setAction(null)
    }
  }

  if (showRejectionForm) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="rejectionReason">Reason for Rejection</Label>
          <Textarea
            id="rejectionReason"
            placeholder="Please explain why this request is being rejected..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={3}
          />
        </div>
        <div className="flex gap-3">
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={loading}
            className="flex-1"
          >
            {loading && action === "reject" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <XCircle className="h-4 w-4 mr-2" />
            Confirm Rejection
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowRejectionForm(false)}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-4">
      <Button
        onClick={handleApprove}
        disabled={loading}
        className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
      >
        {loading && action === "approve" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        <CheckCircle className="h-4 w-4 mr-2" />
        Approve Request
      </Button>
      <Button
        variant="destructive"
        onClick={() => setShowRejectionForm(true)}
        disabled={loading}
        className="flex-1"
      >
        <XCircle className="h-4 w-4 mr-2" />
        Reject Request
      </Button>
    </div>
  )
}
