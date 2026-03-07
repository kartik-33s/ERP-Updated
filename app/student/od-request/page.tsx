"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Upload, Loader2, CheckCircle, X } from "lucide-react"

export default function ODRequestPage() {
  const [eventName, setEventName] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [reason, setReason] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"]
      if (!allowedTypes.includes(selectedFile.type)) {
        setError("Please upload a PDF or image file (JPEG, PNG, WebP)")
        return
      }
      // Validate file size (5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB")
        return
      }
      setFile(selectedFile)
      setError(null)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError("You must be logged in to submit a request")
        setSubmitting(false)
        return
      }

      let proofPathname: string | null = null

      // Upload file if provided
      if (file) {
        setUploading(true)
        const formData = new FormData()
        formData.append("file", file)

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!uploadResponse.ok) {
          const uploadError = await uploadResponse.json()
          throw new Error(uploadError.error || "File upload failed")
        }

        const { pathname } = await uploadResponse.json()
        proofPathname = pathname
        setUploading(false)
      }

      // Create OD request
      const { error: insertError } = await supabase.from("od_requests").insert({
        student_id: user.id,
        event_name: eventName,
        event_date: eventDate,
        reason: reason,
        proof_pathname: proofPathname,
        status: "pending",
      })

      if (insertError) {
        throw new Error(insertError.message)
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/student/dashboard")
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSubmitting(false)
      setUploading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-accent rounded-full">
                <CheckCircle className="h-8 w-8 text-accent-foreground" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-foreground">Request Submitted!</h2>
            <p className="text-muted-foreground">
              Your OD request has been submitted successfully. You will be notified once it is reviewed.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            New OD Request
          </CardTitle>
          <CardDescription>
            Submit an On Duty request for workshops, competitions, seminars, or college events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="eventName">Event Name</Label>
              <Input
                id="eventName"
                placeholder="e.g., National Level Hackathon, IEEE Workshop"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventDate">Event Date</Label>
              <Input
                id="eventDate"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Absence</Label>
              <Textarea
                id="reason"
                placeholder="Describe why you need to attend this event and its relevance..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proof">Supporting Document (Optional)</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Upload a certificate, invitation letter, or registration confirmation
              </p>
              <div className="border-2 border-dashed rounded-lg p-6 text-center bg-muted/30">
                {file ? (
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-5 w-5 text-accent" />
                    <span className="text-sm font-medium">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, JPEG, PNG, or WebP (max 5MB)
                    </p>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={handleFileChange}
                    />
                  </label>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={submitting || uploading}>
              {(submitting || uploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {uploading ? "Uploading..." : submitting ? "Submitting..." : "Submit Request"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
