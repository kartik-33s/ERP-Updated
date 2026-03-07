import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar, CheckCircle, XCircle, FileCheck, Clock } from "lucide-react"

export default async function AttendancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: attendance } = await supabase
    .from("attendance")
    .select("*, lectures(subject, lecture_date, lecture_time, lecture_number)")
    .eq("student_id", user?.id)
    .order("date", { ascending: false })

  // Get lecture-wise statistics
  const { data: lectureStats } = await supabase
    .rpc('get_student_lecture_stats', { p_student_id: user?.id })

  const totalDays = attendance?.length || 0
  const presentDays = attendance?.filter(a => a.status === "present").length || 0
  const absentDays = attendance?.filter(a => a.status === "absent").length || 0
  const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0

  const lectureSchedule = [
    { number: 1, time: "9:15 - 10:10", label: "Lecture 1" },
    { number: 2, time: "10:10 - 11:05", label: "Lecture 2" },
    { number: 3, time: "11:05 - 12:00", label: "Lecture 3" },
    { number: 4, time: "12:00 - 12:55", label: "Lecture 4" },
    { number: 5, time: "12:55 - 1:50", label: "Lecture 5 (Lunch)" },
    { number: 6, time: "1:50 - 2:45", label: "Lecture 6" },
    { number: 7, time: "2:45 - 3:40", label: "Lecture 7" },
    { number: 8, time: "3:40 - 4:35", label: "Lecture 8" },
  ]

  function getStatusBadge(status: string) {
    switch (status) {
      case "present":
        return (
          <Badge className="bg-accent text-accent-foreground">
            <CheckCircle className="h-3 w-3 mr-1" />
            Present
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
        <p className="text-muted-foreground mt-1">View your attendance history and lecture-wise progress</p>
      </div>

      {/* Overall Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overall Attendance</CardDescription>
            <CardTitle className="text-3xl">{attendancePercentage}%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{presentDays} of {totalDays} lectures</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Present</CardDescription>
            <CardTitle className="text-3xl text-accent">{presentDays}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Absent</CardDescription>
            <CardTitle className="text-3xl text-destructive">{absentDays}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Lecture-wise Attendance Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Lecture-wise Attendance
          </CardTitle>
          <CardDescription>Your attendance progress for each lecture slot</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {lectureSchedule.map((lecture) => {
              const stats = lectureStats?.find(s => s.lecture_number === lecture.number)
              const percentage = stats?.attendance_percentage || 0
              const present = stats?.present_count || 0
              const total = stats?.total_lectures || 0

              return (
                <div key={lecture.number} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold">
                        {lecture.number}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{lecture.label}</p>
                        <p className="text-sm text-muted-foreground">{lecture.time}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-foreground">{percentage.toFixed(0)}%</p>
                      <p className="text-xs text-muted-foreground">{present}/{total} lectures</p>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Attendance History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Attendance History
          </CardTitle>
          <CardDescription>Your recent attendance records</CardDescription>
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
                    <div className="flex items-center gap-3">
                      <p className="font-medium text-foreground">
                        {new Date(record.date).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      {record.lectures && (
                        <Badge variant="outline">
                          Lecture {record.lectures.lecture_number}
                        </Badge>
                      )}
                    </div>
                    {record.lectures && (
                      <p className="text-sm text-muted-foreground">
                        {record.lectures.subject} • {record.lectures.lecture_time}
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
