import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, CheckCircle, XCircle, FileCheck } from "lucide-react"

export default async function AttendancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: attendance } = await supabase
    .from("attendance")
    .select("*, od_requests(event_name)")
    .eq("student_id", user?.id)
    .order("date", { ascending: false })

  const totalDays = attendance?.length || 0
  const presentDays = attendance?.filter(a => a.status === "present").length || 0
  const odDays = attendance?.filter(a => a.status === "od").length || 0
  const absentDays = attendance?.filter(a => a.status === "absent").length || 0
  const effectivePresent = presentDays + odDays
  const attendancePercentage = totalDays > 0 ? Math.round((effectivePresent / totalDays) * 100) : 0

  function getStatusBadge(status: string) {
    switch (status) {
      case "present":
        return (
          <Badge className="bg-accent text-accent-foreground">
            <CheckCircle className="h-3 w-3 mr-1" />
            Present
          </Badge>
        )
      case "od":
        return (
          <Badge className="bg-primary text-primary-foreground">
            <FileCheck className="h-3 w-3 mr-1" />
            OD
          </Badge>
        )
      default:
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Absent
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Attendance Record</h1>
        <p className="text-muted-foreground mt-1">View your attendance history</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overall Attendance</CardDescription>
            <CardTitle className="text-3xl">{attendancePercentage}%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{effectivePresent} of {totalDays} days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Present Days</CardDescription>
            <CardTitle className="text-3xl text-accent">{presentDays}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>OD Days</CardDescription>
            <CardTitle className="text-3xl text-primary">{odDays}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Absent Days</CardDescription>
            <CardTitle className="text-3xl text-destructive">{absentDays}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Attendance List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Attendance History
          </CardTitle>
          <CardDescription>Your daily attendance records</CardDescription>
        </CardHeader>
        <CardContent>
          {attendance && attendance.length > 0 ? (
            <div className="space-y-3">
              {attendance.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-muted/30"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">
                      {new Date(record.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    {record.status === "od" && record.od_requests && (
                      <p className="text-sm text-muted-foreground">
                        OD: {record.od_requests.event_name}
                      </p>
                    )}
                  </div>
                  {getStatusBadge(record.status)}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No attendance records yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
