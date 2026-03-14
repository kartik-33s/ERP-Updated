"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, MapPin, CheckCircle, XCircle, Clock, Smartphone } from "lucide-react"

type AttendanceLog = {
  id: string
  student_id: string
  student_latitude: number
  student_longitude: number
  distance_meters: number
  location_verified: boolean
  status: string
  rejection_reason: string | null
  marked_at: string
  device_info: any
  profiles: {
    full_name: string
    student_id: string
  }
  attendance_sessions: {
    subject: string
    section: string
    lecture_number: number
  }
}

export default function AttendanceLogsPage() {
  const [logs, setLogs] = useState<AttendanceLog[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // First get teacher's sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('attendance_sessions')
        .select('id')
        .eq('teacher_id', user.id)

      if (sessionsError) throw sessionsError

      const sessionIds = sessions?.map(s => s.id) || []

      if (sessionIds.length === 0) {
        setLogs([])
        setLoading(false)
        return
      }

      // Then get logs for those sessions
      const { data, error } = await supabase
        .from('attendance_logs')
        .select(`
          *,
          profiles!attendance_logs_student_id_fkey(full_name, student_id),
          attendance_sessions(subject, section, lecture_number)
        `)
        .in('session_id', sessionIds)
        .order('marked_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setLogs(data || [])
    } catch (error) {
      console.error('Error fetching logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string, verified: boolean) => {
    if (status === 'present' && verified) {
      return (
        <Badge className="bg-accent">
          <CheckCircle className="h-3 w-3 mr-1" />
          Verified
        </Badge>
      )
    } else if (status === 'rejected') {
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      )
    }
    return <Badge variant="secondary">{status}</Badge>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Attendance Logs</h1>
        <p className="text-muted-foreground mt-1">Detailed logs of QR attendance attempts</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Attendance Logs
          </CardTitle>
          <CardDescription>View all attendance marking attempts with location data</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No logs found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Lecture</TableHead>
                    <TableHead>Distance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {new Date(log.marked_at).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{log.profiles.full_name}</p>
                          <p className="text-sm text-muted-foreground">{log.profiles.student_id}</p>
                        </div>
                      </TableCell>
                      <TableCell>{log.attendance_sessions.subject}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.attendance_sessions.section}</Badge>
                      </TableCell>
                      <TableCell>L{log.attendance_sessions.lecture_number}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className={log.location_verified ? "text-accent" : "text-destructive"}>
                            {log.distance_meters.toFixed(1)}m
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(log.status, log.location_verified)}
                      </TableCell>
                      <TableCell>
                        {log.rejection_reason ? (
                          <p className="text-sm text-destructive">{log.rejection_reason}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {log.device_info?.platform || 'N/A'}
                          </p>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
