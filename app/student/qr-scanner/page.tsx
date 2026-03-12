"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { QrCode, MapPin, CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react"

export default function QRScannerPage() {
  const [sessionCode, setSessionCode] = useState("")
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [loadingLocation, setLoadingLocation] = useState(false)
  const [marking, setMarking] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    getCurrentLocation()
  }, [])

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

  const markAttendance = async () => {
    if (!sessionCode || !location) {
      alert("Please enter session code and enable location")
      return
    }

    setMarking(true)
    setResult(null)

    try {
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenResolution: `${window.screen.width}x${window.screen.height}`
      }

      const response = await fetch('/api/qr-attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionCode: sessionCode.toUpperCase(),
          latitude: location.latitude,
          longitude: location.longitude,
          deviceInfo
        })
      })

      const data = await response.json()
      setResult({ success: data.success, message: data.message })
      
      if (data.success) {
        setSessionCode("")
      }
    } catch (error: any) {
      setResult({ success: false, message: "Error: " + error.message })
    } finally {
      setMarking(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">QR Attendance Scanner</h1>
        <p className="text-muted-foreground mt-1">Scan QR code or enter session code to mark attendance</p>
      </div>

      {result && (
        <Card className={result.success ? "border-accent bg-accent/10" : "border-destructive bg-destructive/10"}>
          <CardContent className="py-4 flex items-center gap-3">
            {result.success ? (
              <CheckCircle2 className="h-5 w-5 text-accent" />
            ) : (
              <XCircle className="h-5 w-5 text-destructive" />
            )}
            <span className={result.success ? "text-accent font-medium" : "text-destructive font-medium"}>
              {result.message}
            </span>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Session Code Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Enter Session Code
            </CardTitle>
            <CardDescription>Type the code shown on teacher's screen</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Session Code</Label>
              <Input
                value={sessionCode}
                onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                placeholder="e.g., ABC12345"
                className="text-2xl font-mono text-center tracking-wider"
                maxLength={8}
              />
            </div>

            <Button 
              onClick={markAttendance} 
              disabled={marking || !sessionCode || !location}
              className="w-full"
              size="lg"
            >
              {marking ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Marking Attendance...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark Attendance
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Location Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location Status
            </CardTitle>
            <CardDescription>Your location is required for verification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingLocation ? (
              <div className="text-center py-8">
                <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin mb-4" />
                <p className="text-muted-foreground">Getting your location...</p>
              </div>
            ) : location ? (
              <div className="space-y-4">
                <div className="p-4 bg-accent/10 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-accent" />
                    <span className="font-medium text-accent">Location Enabled</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">
                      Latitude: <span className="font-mono">{location.latitude.toFixed(6)}</span>
                    </p>
                    <p className="text-muted-foreground">
                      Longitude: <span className="font-mono">{location.longitude.toFixed(6)}</span>
                    </p>
                  </div>
                </div>

                <Button onClick={getCurrentLocation} variant="outline" className="w-full">
                  <MapPin className="h-4 w-4 mr-2" />
                  Refresh Location
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
                <p className="text-destructive mb-4">
                  {locationError || "Location access required"}
                </p>
                <Button onClick={getCurrentLocation}>
                  <MapPin className="h-4 w-4 mr-2" />
                  Enable Location
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Mark Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 list-decimal list-inside text-muted-foreground">
            <li>Make sure your location is enabled and accurate</li>
            <li>Get the session code from your teacher's screen or scan the QR code</li>
            <li>Enter the 8-character code in the input field above</li>
            <li>Click "Mark Attendance" button</li>
            <li>You must be within the classroom boundary (typically 100m radius)</li>
            <li>Attendance will be marked only if location verification succeeds</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
