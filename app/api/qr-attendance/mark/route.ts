import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { headers } from "next/headers"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { sessionCode, latitude, longitude, deviceInfo } = body

    if (!sessionCode || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get request headers for logging
    const headersList = await headers()
    const userAgent = headersList.get('user-agent') || 'Unknown'
    const forwardedFor = headersList.get('x-forwarded-for')
    const realIp = headersList.get('x-real-ip')
    const ipAddress = forwardedFor?.split(',')[0] || realIp || '0.0.0.0'

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('attendance_sessions')
      .select('*')
      .eq('session_code', sessionCode.toUpperCase())
      .eq('is_active', true)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ 
        success: false,
        message: 'Invalid or expired session'
      })
    }

    // Check if session is still valid
    const now = new Date()
    const expiresAt = new Date(session.expires_at)
    if (now > expiresAt) {
      return NextResponse.json({ 
        success: false,
        message: 'Session has expired'
      })
    }

    // Calculate distance using Haversine formula
    const toRad = (value: number) => (value * Math.PI) / 180
    const R = 6371000 // Earth radius in meters
    const dLat = toRad(latitude - session.latitude)
    const dLon = toRad(longitude - session.longitude)
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(session.latitude)) * Math.cos(toRad(latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c

    const locationVerified = distance <= session.radius_meters
    const status = locationVerified ? 'present' : 'rejected'
    const rejectionReason = locationVerified 
      ? null 
      : `Location verification failed. Distance: ${distance.toFixed(2)}m (Required: <${session.radius_meters}m)`

    // Create attendance log
    const { data: logData, error: logError } = await supabase
      .from('attendance_logs')
      .insert({
        session_id: session.id,
        student_id: user.id,
        student_latitude: latitude,
        student_longitude: longitude,
        distance_meters: distance,
        location_verified: locationVerified,
        status: status,
        rejection_reason: rejectionReason,
        device_info: deviceInfo || {},
        ip_address: ipAddress,
        user_agent: userAgent
      })
      .select()
      .single()

    if (logError) {
      console.error('Error creating log:', logError)
      return NextResponse.json({ error: logError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: locationVerified,
      message: locationVerified ? 'Attendance marked successfully' : rejectionReason,
      attendanceId: locationVerified ? crypto.randomUUID() : null,
      logId: logData.id
    })
  } catch (error: any) {
    console.error('Error in mark QR attendance:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
