"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Users, BookOpen, Calendar, Clock, CheckCircle2, Save } from "lucide-react"

type Class = {
  id: string
  name: string
  section: string
  department: string
}

type Student = {
  id: string
  roll_number: string
  full_name: string
  email: string
}

type AttendanceRecord = {
  student_id: string
  status: "present" | "absent"
}

export default function TeacherAttendancePage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [students, setStudents] = useState<Student[]>([])
  const [subject, setSubject] = useState("")
  const [lectureDate, setLectureDate] = useState(new Date().toISOString().split("T")[0])
  const [lectureTime, setLectureTime] = useState("09:00")
  const [attendance, setAttendance] = useState<Map<string, "present" | "absent">>(new Map())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [teacherId, setTeacherId] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setTeacherId(user.id)
      }

      // Create virtual classes from sections
      const virtualClasses = [
        { id: 'section-a', name: 'Class', section: 'A', department: 'All' },
        { id: 'section-b', name: 'Class', section: 'B', department: 'All' }
      ]
      setClasses(virtualClasses)
      
      setLoading(false)
    }

    fetchData()
  }, [])

  useEffect(() => {
    async function fetchStudents() {
      if (!selectedClass) {
        setStudents([])
        return
      }

      // Extract section from selectedClass (e.g., 'section-a' -> 'A')
      const section = selectedClass.split('-')[1].toUpperCase()

      const { data: profilesData, error } = await supabase
        .from("profiles")
        .select("id, student_id, full_name, email, section")
        .eq("role", "student")
        .eq("section", section)
        .order("student_id", { ascending: true })

      console.log('Fetching students for section:', section)
      console.log('Profiles data:', profilesData)
      console.log('Error:', error)

      if (profilesData) {
        // Map profiles to student format
        const studentsData = profilesData.map(p => ({
          id: p.id,
          roll_number: p.student_id,
          full_name: p.full_name,
          email: p.email
        }))
        setStudents(studentsData)
        // Initialize all students as absent
        const initialAttendance = new Map<string, "present" | "absent">()
        studentsData.forEach((s) => initialAttendance.set(s.id, "absent"))
        setAttendance(initialAttendance)
      }
    }

    fetchStudents()
  }, [selectedClass])

  const toggleAttendance = (studentId: string) => {
    setAttendance((prev) => {
      const newMap = new Map(prev)
      newMap.set(studentId, prev.get(studentId) === "present" ? "absent" : "present")
      return newMap
    })
  }

  const markAllPresent = () => {
    const newAttendance = new Map<string, "present" | "absent">()
    students.forEach((s) => newAttendance.set(s.id, "present"))
    setAttendance(newAttendance)
  }

  const markAllAbsent = () => {
    const newAttendance = new Map<string, "present" | "absent">()
    students.forEach((s) => newAttendance.set(s.id, "absent"))
    setAttendance(newAttendance)
  }

  const saveAttendance = async () => {
    if (!selectedClass || !subject || !lectureDate || !lectureTime || !teacherId) {
      alert("Please fill all required fields")
      return
    }

    setSaving(true)
    setSuccess(false)

    try {
      // Create lecture
      const { data: lecture, error: lectureError } = await supabase
        .from("lectures")
        .insert({
          class_id: selectedClass,
          subject,
          teacher_id: teacherId,
          lecture_date: lectureDate,
          lecture_time: lectureTime,
        })
        .select()
        .single()

      if (lectureError) throw lectureError

      // Create attendance records
      const attendanceRecords = Array.from(attendance.entries()).map(([studentId, status]) => ({
        student_id: studentId,
        lecture_id: lecture.id,
        date: lectureDate,
        status,
        marked_by: teacherId,
      }))

      const { error: attendanceError } = await supabase
        .from("attendance")
        .insert(attendanceRecords)

      if (attendanceError) throw attendanceError

      setSuccess(true)
      // Reset form
      setSubject("")
      setSelectedClass("")
      setStudents([])
      setAttendance(new Map())

      setTimeout(() => setSuccess(false), 3000)
    } catch (error: any) {
      alert("Error saving attendance: " + error.message)
    } finally {
      setSaving(false)
    }
  }

  const presentCount = Array.from(attendance.values()).filter((s) => s === "present").length
  const absentCount = students.length - presentCount

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mark Attendance</h1>
        <p className="text-muted-foreground mt-1">Record lecture attendance for students</p>
      </div>

      {success && (
        <Card className="border-accent bg-accent/10">
          <CardContent className="py-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-accent" />
            <span className="text-accent font-medium">Attendance saved successfully!</span>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Lecture Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Lecture Details
            </CardTitle>
            <CardDescription>Enter lecture information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="class">Select Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} - Section {cls.section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Data Structures"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={lectureDate}
                  onChange={(e) => setLectureDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time" className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Time
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={lectureTime}
                  onChange={(e) => setLectureTime(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Attendance Summary
            </CardTitle>
            <CardDescription>Quick overview of attendance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-lg bg-muted">
                <div className="text-3xl font-bold text-foreground">{students.length}</div>
                <div className="text-sm text-muted-foreground">Total Students</div>
              </div>
              <div className="p-4 rounded-lg bg-accent/10">
                <div className="text-3xl font-bold text-accent">{presentCount}</div>
                <div className="text-sm text-muted-foreground">Present</div>
              </div>
              <div className="p-4 rounded-lg bg-destructive/10">
                <div className="text-3xl font-bold text-destructive">{absentCount}</div>
                <div className="text-sm text-muted-foreground">Absent</div>
              </div>
            </div>

            {students.length > 0 && (
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" onClick={markAllPresent} className="flex-1">
                  Mark All Present
                </Button>
                <Button variant="outline" size="sm" onClick={markAllAbsent} className="flex-1">
                  Mark All Absent
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Student List */}
      {students.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Student List</CardTitle>
            <CardDescription>Click on a student to toggle their attendance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {students.map((student) => {
                const isPresent = attendance.get(student.id) === "present"
                return (
                  <div
                    key={student.id}
                    onClick={() => toggleAttendance(student.id)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      isPresent
                        ? "border-accent bg-accent/10"
                        : "border-border bg-card hover:border-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox checked={isPresent} className="pointer-events-none" />
                        <div>
                          <div className="font-medium text-sm">{student.full_name}</div>
                          <div className="text-xs text-muted-foreground">{student.roll_number}</div>
                        </div>
                      </div>
                      <Badge variant={isPresent ? "default" : "secondary"} className={isPresent ? "bg-accent" : ""}>
                        {isPresent ? "P" : "A"}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={saveAttendance} disabled={saving || !subject} size="lg">
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Attendance"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedClass && students.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No students found in this class</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
