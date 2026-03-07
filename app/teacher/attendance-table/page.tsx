"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Download, Users, CheckCircle, XCircle } from "lucide-react"

type Student = {
  id: string
  student_id: string
  full_name: string
  section: string
}

type LectureAttendance = {
  lecture_number: number
  status: string | null
  subject: string | null
}

type StudentAttendanceData = {
  student: Student
  lectures: Record<number, LectureAttendance>
  totalPresent: number
  totalAbsent: number
  percentage: number
}

export default function AttendanceTablePage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [sectionAData, setSectionAData] = useState<StudentAttendanceData[]>([])
  const [sectionBData, setSectionBData] = useState<StudentAttendanceData[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const lectureSchedule = [
    { number: 1, time: "9:15-10:10" },
    { number: 2, time: "10:10-11:05" },
    { number: 3, time: "11:05-12:00" },
    { number: 4, time: "12:00-12:55" },
    { number: 5, time: "12:55-1:50", isLunch: true },
    { number: 6, time: "1:50-2:45" },
    { number: 7, time: "2:45-3:40" },
    { number: 8, time: "3:40-4:35" },
  ]

  useEffect(() => {
    fetchAttendanceData()
  }, [selectedDate])

  async function fetchAttendanceData() {
    setLoading(true)
    try {
      // Fetch students for both sections
      const { data: students } = await supabase
        .from("profiles")
        .select("id, student_id, full_name, section")
        .eq("role", "student")
        .in("section", ["A", "B"])
        .order("student_id", { ascending: true })

      if (!students) {
        setLoading(false)
        return
      }

      // Fetch lectures for the selected date
      const { data: lectures } = await supabase
        .from("lectures")
        .select("id, lecture_number, subject, section")
        .eq("lecture_date", selectedDate)

      // Fetch attendance for the selected date
      const { data: attendance } = await supabase
        .from("attendance")
        .select("student_id, lecture_id, status, lectures(lecture_number, section)")
        .eq("date", selectedDate)

      // Process data for each section
      const processSection = (section: string) => {
        const sectionStudents = students.filter(s => s.section === section)
        
        return sectionStudents.map(student => {
          const lecturesData: Record<number, LectureAttendance> = {}
          let totalPresent = 0
          let totalAbsent = 0

          // Initialize all lectures
          lectureSchedule.forEach(lecture => {
            lecturesData[lecture.number] = {
              lecture_number: lecture.number,
              status: null,
              subject: null
            }
          })

          // Fill in attendance data
          attendance?.forEach(att => {
            if (att.student_id === student.id && att.lectures?.section === section) {
              const lectureNum = att.lectures.lecture_number
              if (lectureNum) {
                const lecture = lectures?.find(l => 
                  l.lecture_number === lectureNum && l.section === section
                )
                
                lecturesData[lectureNum] = {
                  lecture_number: lectureNum,
                  status: att.status,
                  subject: lecture?.subject || null
                }

                if (att.status === "present") totalPresent++
                if (att.status === "absent") totalAbsent++
              }
            }
          })

          const total = totalPresent + totalAbsent
          const percentage = total > 0 ? Math.round((totalPresent / total) * 100) : 0

          return {
            student,
            lectures: lecturesData,
            totalPresent,
            totalAbsent,
            percentage
          }
        })
      }

      setSectionAData(processSection("A"))
      setSectionBData(processSection("B"))
    } catch (error) {
      console.error("Error fetching attendance:", error)
    } finally {
      setLoading(false)
    }
  }

  function getStatusCell(lecture: LectureAttendance) {
    if (!lecture.status) {
      return (
        <TableCell className="text-center bg-muted/30">
          <span className="text-muted-foreground text-xs">-</span>
        </TableCell>
      )
    }

    if (lecture.status === "present") {
      return (
        <TableCell className="text-center bg-accent/10">
          <div className="flex flex-col items-center gap-1">
            <CheckCircle className="h-4 w-4 text-accent" />
            {lecture.subject && (
              <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                {lecture.subject}
              </span>
            )}
          </div>
        </TableCell>
      )
    }

    return (
      <TableCell className="text-center bg-destructive/10">
        <div className="flex flex-col items-center gap-1">
          <XCircle className="h-4 w-4 text-destructive" />
          {lecture.subject && (
            <span className="text-xs text-muted-foreground truncate max-w-[80px]">
              {lecture.subject}
            </span>
          )}
        </div>
      </TableCell>
    )
  }

  function renderAttendanceTable(data: StudentAttendanceData[], section: string) {
    if (data.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No students found in Section {section}</p>
        </div>
      )
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px] sticky left-0 bg-background z-10">Roll No</TableHead>
              <TableHead className="min-w-[200px] sticky left-[100px] bg-background z-10">Student Name</TableHead>
              {lectureSchedule.map(lecture => (
                <TableHead key={lecture.number} className="text-center min-w-[100px]">
                  <div className="flex flex-col items-center">
                    <span className="font-semibold">L{lecture.number}</span>
                    <span className="text-xs text-muted-foreground">{lecture.time}</span>
                    {lecture.isLunch && (
                      <Badge variant="outline" className="text-xs mt-1">Lunch</Badge>
                    )}
                  </div>
                </TableHead>
              ))}
              <TableHead className="text-center min-w-[100px] sticky right-0 bg-background z-10">
                <div className="flex flex-col items-center">
                  <span className="font-semibold">Total</span>
                  <span className="text-xs text-muted-foreground">P/A</span>
                </div>
              </TableHead>
              <TableHead className="text-center min-w-[80px] sticky right-0 bg-background z-10">%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((studentData) => (
              <TableRow key={studentData.student.id}>
                <TableCell className="font-medium sticky left-0 bg-background z-10">
                  {studentData.student.student_id}
                </TableCell>
                <TableCell className="sticky left-[100px] bg-background z-10">
                  {studentData.student.full_name}
                </TableCell>
                {lectureSchedule.map(lecture => 
                  getStatusCell(studentData.lectures[lecture.number])
                )}
                <TableCell className="text-center sticky right-0 bg-background z-10">
                  <div className="flex items-center justify-center gap-2">
                    <Badge variant="default" className="bg-accent">
                      {studentData.totalPresent}
                    </Badge>
                    <span className="text-muted-foreground">/</span>
                    <Badge variant="destructive">
                      {studentData.totalAbsent}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-center font-semibold sticky right-0 bg-background z-10">
                  <Badge 
                    variant={studentData.percentage >= 75 ? "default" : "destructive"}
                    className={studentData.percentage >= 75 ? "bg-accent" : ""}
                  >
                    {studentData.percentage}%
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  const sectionAStats = {
    totalStudents: sectionAData.length,
    avgAttendance: sectionAData.length > 0 
      ? Math.round(sectionAData.reduce((sum, s) => sum + s.percentage, 0) / sectionAData.length)
      : 0,
    totalPresent: sectionAData.reduce((sum, s) => sum + s.totalPresent, 0),
    totalAbsent: sectionAData.reduce((sum, s) => sum + s.totalAbsent, 0),
  }

  const sectionBStats = {
    totalStudents: sectionBData.length,
    avgAttendance: sectionBData.length > 0
      ? Math.round(sectionBData.reduce((sum, s) => sum + s.percentage, 0) / sectionBData.length)
      : 0,
    totalPresent: sectionBData.reduce((sum, s) => sum + s.totalPresent, 0),
    totalAbsent: sectionBData.reduce((sum, s) => sum + s.totalAbsent, 0),
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Attendance Table</h1>
        <p className="text-muted-foreground mt-1">View lecture-wise attendance for all students</p>
      </div>

      {/* Date Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Select Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-xs">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <Button onClick={fetchAttendanceData} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Sections */}
      <Tabs defaultValue="section-a" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="section-a">
            Section A ({sectionAStats.totalStudents} students)
          </TabsTrigger>
          <TabsTrigger value="section-b">
            Section B ({sectionBStats.totalStudents} students)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="section-a" className="space-y-4">
          {/* Section A Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Students</CardDescription>
                <CardTitle className="text-2xl">{sectionAStats.totalStudents}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Average Attendance</CardDescription>
                <CardTitle className="text-2xl">{sectionAStats.avgAttendance}%</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Present</CardDescription>
                <CardTitle className="text-2xl text-accent">{sectionAStats.totalPresent}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Absent</CardDescription>
                <CardTitle className="text-2xl text-destructive">{sectionAStats.totalAbsent}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Section A Table */}
          <Card>
            <CardHeader>
              <CardTitle>Section A - Attendance Table</CardTitle>
              <CardDescription>
                Lecture-wise attendance for {new Date(selectedDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderAttendanceTable(sectionAData, "A")}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="section-b" className="space-y-4">
          {/* Section B Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Students</CardDescription>
                <CardTitle className="text-2xl">{sectionBStats.totalStudents}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Average Attendance</CardDescription>
                <CardTitle className="text-2xl">{sectionBStats.avgAttendance}%</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Present</CardDescription>
                <CardTitle className="text-2xl text-accent">{sectionBStats.totalPresent}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Absent</CardDescription>
                <CardTitle className="text-2xl text-destructive">{sectionBStats.totalAbsent}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Section B Table */}
          <Card>
            <CardHeader>
              <CardTitle>Section B - Attendance Table</CardTitle>
              <CardDescription>
                Lecture-wise attendance for {new Date(selectedDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderAttendanceTable(sectionBData, "B")}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-accent" />
              <span className="text-sm">Present</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm">Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">-</span>
              <span className="text-sm">Not Marked</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Lunch</Badge>
              <span className="text-sm">Lunch Period (Lecture 5)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
