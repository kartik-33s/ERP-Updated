"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Calendar, Clock, CheckCircle, XCircle, AlertCircle, TrendingUp } from "lucide-react"

type Lecture = {
  id: string
  subject: string
  lecture_date: string
  lecture_time: string
  teacher: {
    full_name: string
  } | null
}

type AttendanceRecord = {
  id: string
  status: string
  lecture: Lecture
}

type SubjectStats = {
  subject: string
  total: number
  present: number
  absent: number
  od: number
  percentage: number
}

export default function StudentLecturesPage() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [subjectStats, setSubjectStats] = useState<SubjectStats[]>([])
  const [selectedSubject, setSelectedSubject] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [studentId, setStudentId] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function fetchStudentAndAttendance() {
      setLoading(true)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get the student profile linked to this user (via email match)
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", user.id)
        .single()

      if (!profile) return

      // Find student by email
      const { data: student } = await supabase
        .from("students")
        .select("id")
        .eq("email", profile.email)
        .single()

      if (student) {
        setStudentId(student.id)
        
        // Fetch attendance with lecture details
        const { data: attendanceData } = await supabase
          .from("attendance")
          .select(`
            id,
            status,
            lecture:lectures(
              id,
              subject,
              lecture_date,
              lecture_time,
              teacher:profiles(full_name)
            )
          `)
          .eq("student_id", student.id)
          .order("date", { ascending: false })

        if (attendanceData) {
          // Filter out records without lectures
          const validAttendance = attendanceData.filter((a) => a.lecture) as AttendanceRecord[]
          setAttendance(validAttendance)

          // Calculate subject-wise stats
          const statsMap = new Map<string, SubjectStats>()
          
          validAttendance.forEach((record) => {
            const subject = record.lecture.subject
            if (!statsMap.has(subject)) {
              statsMap.set(subject, {
                subject,
                total: 0,
                present: 0,
                absent: 0,
                od: 0,
                percentage: 0,
              })
            }
            
            const stats = statsMap.get(subject)!
            stats.total++
            if (record.status === "present") stats.present++
            else if (record.status === "absent") stats.absent++
            else if (record.status === "od") stats.od++
          })

          // Calculate percentages
          statsMap.forEach((stats) => {
            stats.percentage = Math.round(((stats.present + stats.od) / stats.total) * 100)
          })

          setSubjectStats(Array.from(statsMap.values()).sort((a, b) => a.subject.localeCompare(b.subject)))
        }
      }

      setLoading(false)
    }

    fetchStudentAndAttendance()
  }, [])

  const filteredAttendance = selectedSubject === "all" 
    ? attendance 
    : attendance.filter((a) => a.lecture.subject === selectedSubject)

  const overallStats = {
    total: attendance.length,
    present: attendance.filter((a) => a.status === "present").length,
    absent: attendance.filter((a) => a.status === "absent").length,
    od: attendance.filter((a) => a.status === "od").length,
  }
  const overallPercentage = overallStats.total > 0 
    ? Math.round(((overallStats.present + overallStats.od) / overallStats.total) * 100) 
    : 0

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <CheckCircle className="h-4 w-4 text-accent" />
      case "absent":
        return <XCircle className="h-4 w-4 text-destructive" />
      case "od":
        return <AlertCircle className="h-4 w-4 text-primary" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge className="bg-accent">Present</Badge>
      case "absent":
        return <Badge variant="destructive">Absent</Badge>
      case "od":
        return <Badge className="bg-primary">OD</Badge>
      default:
        return null
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":")
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Lecture Attendance</h1>
        <p className="text-muted-foreground mt-1">View your subject-wise attendance records</p>
      </div>

      {/* Overall Summary */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className={`text-4xl font-bold ${
                overallPercentage >= 75 ? "text-accent" : 
                overallPercentage >= 60 ? "text-yellow-500" : "text-destructive"
              }`}>
                {overallPercentage}%
              </div>
              <div className="text-sm text-muted-foreground">
                {overallStats.present + overallStats.od} / {overallStats.total} lectures
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Present</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">{overallStats.present}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Absent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{overallStats.absent}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">On Duty</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{overallStats.od}</div>
          </CardContent>
        </Card>
      </div>

      {/* Subject-wise Stats */}
      {subjectStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Subject-wise Attendance
            </CardTitle>
            <CardDescription>Your attendance percentage by subject</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {subjectStats.map((stat) => (
                <div key={stat.subject} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{stat.subject}</span>
                    <span className={`text-lg font-bold ${
                      stat.percentage >= 75 ? "text-accent" : 
                      stat.percentage >= 60 ? "text-yellow-500" : "text-destructive"
                    }`}>
                      {stat.percentage}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        stat.percentage >= 75 ? "bg-accent" : 
                        stat.percentage >= 60 ? "bg-yellow-500" : "bg-destructive"
                      }`}
                      style={{ width: `${stat.percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>P: {stat.present}</span>
                    <span>A: {stat.absent}</span>
                    <span>OD: {stat.od}</span>
                    <span>Total: {stat.total}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lecture-wise Details */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Lecture History
              </CardTitle>
              <CardDescription>Detailed attendance for each lecture</CardDescription>
            </div>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjectStats.map((stat) => (
                  <SelectItem key={stat.subject} value={stat.subject}>
                    {stat.subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAttendance.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No lecture records found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAttendance.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(record.status)}
                    <div>
                      <div className="font-medium">{record.lecture.subject}</div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(record.lecture.lecture_date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(record.lecture.lecture_time)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(record.status)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
