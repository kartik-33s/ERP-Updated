"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QrCode, MapPin, CheckCircle2, XCircle, Loader2, AlertCircle, Camera, X } from "lucide-react"

export default function QRScannerPage() {
  const [sessionCode, setSessionCode] = useState("")
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [loadingLocation, setLoadingLocation] = useState(false)
  const [marking, setMarking] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [scanning, setScanning] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    getCurrentLocation()
    
    return () => {
      stopScanning()
    }
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

  const startScanning = async () => {
    setCameraError(null)
    
    // Check if BarcodeDetector is supported
    if (!('BarcodeDetector' in window)) {
      setCameraError("QR code scanning is not supported in this browser. Please use Chrome, Edge, or enter the code manually.")
      return
    }
    
    setScanning(true)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        
        // Start scanning for QR codes
        scanIntervalRef.current = setInterval(() => {
          captureAndDecodeQR()
        }, 500)
      }
    } catch (error: any) {
      setCameraError(error.message || "Failed to access camera")
      setScanning(false)
    }
  }

  const stopScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setScanning(false)
  }

  const captureAndDecodeQR = async () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    try {
      // Use BarcodeDetector API if available
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] })
        const barcodes = await barcodeDetector.detect(canvas)
        
        if (barcodes.length > 0) {
          const qrData = barcodes[0].rawValue
          handleQRCodeDetected(qrData)
        }
      }
    } catch (error) {
      console.error('QR detection error:', error)
    }
  }

  const handleQRCodeDetected = (qrData: string) => {
    try {
      const parsed = JSON.parse(qrData)
      if (parsed.code) {
        setSessionCode(parsed.code)
        stopScanning()
        setTimeout(() => markAttendance(parsed.code), 500)
      }
    } catch (error) {
      // If not JSON, treat as plain session code
      setSessionCode(qrData)
      stopScanning()
      setTimeout(() => markAttendance(qrData), 500)
    }
  }

  const markAttendance = async (code?: string) => {
    const codeToUse = code || sessionCode
    
    if (!codeToUse || !location) {
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
          sessionCode: codeToUse.toUpperCase(),
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

      <Tabs defaultValue="scan" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="scan">
            <Camera className="h-4 w-4 mr-2" />
            Scan QR Code
          </TabsTrigger>
          <TabsTrigger value="manual">
            <QrCode className="h-4 w-4 mr-2" />
            Enter Code
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scan" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                QR Code Scanner
              </CardTitle>
              <CardDescription>Point your camera at the QR code displayed by your teacher</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!scanning ? (
                <div className="text-center py-8">
                  <Camera className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Click the button below to start scanning
                  </p>
                  <Button onClick={startScanning} size="lg" disabled={!location}>
                    <Camera className="h-4 w-4 mr-2" />
                    Start Camera
                  </Button>
                  {!location && (
                    <p className="text-sm text-destructive mt-2">
                      Please enable location first
                    </p>
                  )}
                  {cameraError && (
                    <p className="text-sm text-destructive mt-2">{cameraError}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      className="w-full h-auto"
                      playsInline
                      muted
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="absolute inset-0 border-4 border-accent/50 m-8 rounded-lg pointer-events-none" />
                  </div>
                  <Button onClick={stopScanning} variant="destructive" className="w-full">
                    <X className="h-4 w-4 mr-2" />
                    Stop Scanning
                  </Button>
                  <p className="text-sm text-center text-muted-foreground">
                    Position the QR code within the frame
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location Status for Scan Tab */}
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
        </TabsContent>

        <TabsContent value="manual" className="space-y-6">
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
                  onClick={() => markAttendance()} 
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
        </TabsContent>
      </Tabs>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Mark Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 list-decimal list-inside text-muted-foreground">
            <li>Make sure your location is enabled and accurate</li>
            <li>Choose either "Scan QR Code" or "Enter Code" tab</li>
            <li>For scanning: Click "Start Camera" and point at the QR code</li>
            <li>For manual: Enter the 8-character code shown by your teacher</li>
            <li>You must be within the classroom boundary (typically 100m radius)</li>
            <li>Attendance will be marked only if location verification succeeds</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
