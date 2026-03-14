"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { QrCode, MapPin, Clock, Users, CheckCircle2, XCircle, Loader2, StopCircle } from "lucide-react"
import QRCode from "qrcode"

type ActiveSession = {
  session_id: string
  session_code: string
  subject: string
  section: string
  lecture_number: number
  starts_at: string
  expires_at: string
  total_scans: number
  successful_scans: number
}

export default function QRAttendancePage() {
  const [subject, setSubject] = useState("")
  const [section, setSection] = useState("")
  const [lectureDate, setLectureDate] = useState(new Date().toISOString().split("T")[0])
  const [lectureNumber, setLectureNumber] = useState<number>(1)
  const [lectureTime, setLectureTime] = useState("09:15")
  const [radiusMeters, setRadiusMeters] = useState(100)
  const [durationMinutes, setDurationMinutes] = useState(15)
  
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [loadingLocation, setLoadingLocation] = useState(false)
  
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const lectureSchedule = [
    { number: 1, time: "09:15", label: "Lecture 1 (9:15 - 10:10)" },
    { number: 2, time: "10:10", label: "Lecture 2 (10:10 - 11:05)" },
    { number: 3, time: "11:05", label: "Lecture 3 (11:05 - 12:00)" },
    { number: 4, time: "12:00", label: "Lecture 4 (12:00 - 12:55)" },
    { number: 5, time: "12:55", label: "Lecture 5 (12:55 - 1:50)" },
    { number: 6, time: "13:50", label: "Lecture 6 (1:50 - 2:45)" },
    { number: 7, time: "14:45", label: "Lecture 7 (2:45 - 3:40)" },
    { number: 8, time: "15:40", label: "Lecture 8 (3:40 - 4:35)" },
  ]

  useEffect(() => {
    const lecture = lectureSchedule.find(l => l.number === lectureNumber)
    if (lecture) {
      setLectureTime(lecture.time)
    }
  }, [lectureNumber])

  useEffect(() => {
    fetchActiveSession()
    const interval = setInterval(fetchActiveSession, 5000) // Poll every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchActiveSession = async () => {
    try {
      const response = await fetch('/api/qr-session/active')
      
      if (!response.ok) {
        console.error('Failed to fetch active session:', response.status, response.statusText)
        setActiveSession(null)
        setQrCodeUrl(null)
        setLoading(false)
        return
      }

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Expected JSON response but got:', contentType)
        setActiveSession(null)
        setQrCodeUrl(null)
        setLoading(false)
        return
      }

      const data = await response.json()
      
      if (data.success && data.session) {
        setActiveSession(data.session)
        // Generate QR code
        const qrData = JSON.stringify({
          code: data.session.session_code,
          subject: data.session.subject,
          section: data.session.section
        })
        const qrUrl = await QRCode.toDataURL(qrData, { width: 400, margin: 2 })
        setQrCodeUrl(qrUrl)
      } else {
        setActiveSession(null)
        setQrCodeUrl(null)
      }
    } catch (error) {
      console.error('Error fetching active session:', error)
      setActiveSession(null)
      setQrCodeUrl(null)
    } finally {
      setLoading(false)
    }
  }

  const getCurrentLocation = () => {
    setLoadingLocation(true)
    setLocationError(null)

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser")
      setLoadingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        })
        setLoadingLocation(false)
      },
      (error) => {
        setLocationError(error.message)
        setLoadingLocation(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const createSession = async () => {
    if (!subject || !section || !location) {
      alert("Please fill all fields and get your location")
      return
    }

    setCreating(true)
    try {
      const response = await fetch('/api/qr-session/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          section,
          lectureDate,
          lectureTime,
          lectureNumber,
          latitude: location.latitude,
          longitude: location.longitude,
          radiusMeters,
          durationMinutes
        })
      })

      const data = await response.json()
      
      if (data.success) {
        await fetchActiveSession()
        // Reset form
        setSubject("")
        setSection("")
      } else {
        alert("Error creating session: " + data.error)
      }
    } catch (error: any) {
      alert("Error: " + error.message)
    } finally {
      setCreating(false)
    }
  }

  const deactivateSession = async () => {
    if (!activeSession) return

    try {
      const response = await fetch('/api/qr-session/deactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: activeSession.session_id })
      })

      const data = await response.json()
      
      if (data.success) {
        setActiveSession(null)
        setQrCodeUrl(null)
      } else {
        alert("Error deactivating session: " + data.error)
      }
    } catch (error: any) {
      alert("Error: " + error.message)
    }
  }

  const getTimeRemaining = () => {
    if (!activeSession) return ""
    const now = new Date()
    const expires = new Date(activeSession.expires_at)
    const diff = expires.getTime() - now.getTime()
    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">QR Attendance</h1>
        <p className="text-muted-foreground mt-1">Generate QR codes for geo-verified attendance</p>
      </div>

      {activeSession ? (
        <div className="space-y-6">
          {/* Active Session Display */}
          <Card className="border-accent">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-accent">
                    <QrCode className="h-6 w-6" />
                    Active Session
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {activeSession.subject} - Section {activeSession.section}
                  </CardDescription>
                </div>
                <Button variant="destructive" onClick={deactivateSession}>
                  <StopCircle className="h-4 w-4 mr-2" />
                  End Session
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* QR Code */}
                <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg">
                  {qrCodeUrl && (
                    <img src={qrCodeUrl} alt="QR Code" className="w-full max-w-sm" />
                  )}
                  <div className="mt-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">{activeSession.session_code}</p>
                    <p className="text-sm text-gray-600 mt-1">Session Code</p>
                  </div>
                </div>

                {/* Session Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Time Remaining</p>
                      <p className="text-2xl font-bold text-foreground">{getTimeRemaining()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-accent/10 rounded-lg text-center">
                      <p className="text-3xl font-bold text-accent">{activeSession.successful_scans}</p>
                      <p className="text-sm text-muted-foreground">Successful</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-3xl font-bold text-foreground">{activeSession.total_scans}</p>
                      <p className="text-sm text-muted-foreground">Total Scans</p>
                    </div>
                  </div>

                  <div className="space-y-2 p-4 bg-muted rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Lecture:</span>
                      <span className="font-medium">Lecture {activeSession.lecture_number}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Started:</span>
                      <span className="font-medium">
                        {new Date(activeSession.starts_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Expires:</span>
                      <span className="font-medium">
                        {new Date(activeSession.expires_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Create Session Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Create QR Session
              </CardTitle>
              <CardDescription>Generate a new QR code for attendance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Section</Label>
                <Select value={section} onValueChange={setSection}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose section" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Section A</SelectItem>
                    <SelectItem value="B">Section B</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Data Structures"
                />
              </div>

              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={lectureDate}
                  onChange={(e) => setLectureDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Lecture Slot</Label>
                <Select 
                  value={lectureNumber.toString()} 
                  onValueChange={(value) => setLectureNumber(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {lectureSchedule.map((lecture) => (
                      <SelectItem key={lecture.number} value={lecture.number.toString()}>
                        {lecture.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Radius (meters)</Label>
                  <Input
                    type="number"
                    value={radiusMeters}
                    onChange={(e) => setRadiusMeters(parseInt(e.target.value))}
                    min="10"
                    max="500"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration (min)</Label>
                  <Input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
                    min="5"
                    max="60"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Setup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location Setup
              </CardTitle>
              <CardDescription>Set the classroom location for geo-fencing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!location ? (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Get your current location to set the attendance boundary
                  </p>
                  <Button onClick={getCurrentLocation} disabled={loadingLocation}>
                    {loadingLocation ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Getting Location...
                      </>
                    ) : (
                      <>
                        <MapPin className="h-4 w-4 mr-2" />
                        Get Current Location
                      </>
                    )}
                  </Button>
                  {locationError && (
                    <p className="text-destructive text-sm mt-4">{locationError}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-accent/10 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-5 w-5 text-accent" />
                      <span className="font-medium text-accent">Location Set</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground">
                        Latitude: <span className="font-mono">{location.latitude.toFixed(6)}</span>
                      </p>
                      <p className="text-muted-foreground">
                        Longitude: <span className="font-mono">{location.longitude.toFixed(6)}</span>
                      </p>
                      <p className="text-muted-foreground mt-2">
                        Radius: <span className="font-medium">{radiusMeters}m</span>
                      </p>
                    </div>
                  </div>

                  <Button onClick={getCurrentLocation} variant="outline" className="w-full">
                    <MapPin className="h-4 w-4 mr-2" />
                    Update Location
                  </Button>

                  <Button 
                    onClick={createSession} 
                    disabled={creating || !subject || !section}
                    className="w-full"
                    size="lg"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating Session...
                      </>
                    ) : (
                      <>
                        <QrCode className="h-4 w-4 mr-2" />
                        Generate QR Code
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
