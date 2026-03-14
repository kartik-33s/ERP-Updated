import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { headers } from "next/headers"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    console.log('Mark attendance - Auth check:', { userId: user?.id, authError })

    if (!user) {
      console.error('Mark attendance - No user authenticated')
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { sessionCode, latitude, longitude, deviceInfo } = body

    console.log('Mark attendance - Request:', { sessionCode, latitude, longitude, userId: user.id })

    if (!sessionCode || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get request headers for logging
    const headersList = await headers()
    const userAgent = headersList.get('user-agent') || 'Unknown'
    const forwardedFor = headersList.get('x-forwarded-for')
    const realIp = headersList.get('x-real-ip')
    const ipAddress = forwardedFor?.split(',')[0] || realIp || '0.0.0.0'

    // Get student profile to check section
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('section, role')
      .eq('id', user.id)
      .single()

    console.log('Student profile:', { profile, profileError })

    if (profileError || !profile) {
      return NextResponse.json({ 
        success: false,
        message: 'Student profile not found'
      })
    }

    if (profile.role !== 'student') {
      return NextResponse.json({ 
        success: false,
        message: 'Only students can mark attendance'
      })
    }

    // Get session - try without any filters first for debugging
    const { data: allSessionsDebug, error: allSessionsDebugError } = await supabase
      .from('attendance_sessions')
      .select('session_code, section, is_active, expires_at')
      .eq('session_code', sessionCode.toUpperCase())

    console.log('Debug - All sessions query (no filters):', { 
      sessionCode: sessionCode.toUpperCase(), 
      allSessionsDebug, 
      allSessionsDebugError,
      studentSection: profile.section
    })

    // Get session - try without is_active filter first for debugging
    const { data: allSessions, error: allSessionsError } = await supabase
      .from('attendance_sessions')
      .select('*')
      .eq('session_code', sessionCode.toUpperCase())

    console.log('All sessions with this code:', { sessionCode: sessionCode.toUpperCase(), allSessions, allSessionsError })

    // Get session with active filter
    const { data: session, error: sessionError } = await supabase
      .from('attendance_sessions')
      .select('*')
      .eq('session_code', sessionCode.toUpperCase())
      .eq('is_active', true)
      .single()

    console.log('Active session lookup:', { sessionCode: sessionCode.toUpperCase(), session, sessionError })

    if (sessionError || !session) {
      // Check if session exists but is inactive
      if (allSessions && allSessions.length > 0) {
        const inactiveSession = allSessions[0]
        if (!inactiveSession.is_active) {
          return NextResponse.json({ 
            success: false,
            message: 'This session has been ended by the teacher'
          })
        }
        if (new Date() > new Date(inactiveSession.expires_at)) {
          return NextResponse.json({ 
            success: false,
            message: `Session expired at ${new Date(inactiveSession.expires_at).toLocaleTimeString()}`
          })
        }
      }
      
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

    // Verify student section matches session section
    if (profile.section !== session.section) {
      return NextResponse.json({ 
        success: false,
        message: 'This session is not for your section'
      })
    }

    // Check if student already marked attendance for this session
    const { data: existingLog } = await supabase
      .from('attendance_logs')
      .select('id')
      .eq('session_id', session.id)
      .eq('student_id', user.id)
      .single()

    if (existingLog) {
      return NextResponse.json({ 
        success: false,
        message: 'You have already marked attendance for this session'
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

    let attendanceId = null

    // If location verified, create actual attendance record
    if (locationVerified) {
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .insert({
          lecture_id: session.lecture_id,
          student_id: user.id,
          status: 'present',
          date: session.lecture_date
        })
        .select()
        .single()

      if (attendanceError) {
        console.error('Error creating attendance:', attendanceError)
        return NextResponse.json({ error: attendanceError.message }, { status: 500 })
      }

      attendanceId = attendanceData.id
    }

    // Create attendance log
    const logInsertData = {
      session_id: session.id,
      student_id: user.id,
      attendance_id: attendanceId,
      student_latitude: latitude,
      student_longitude: longitude,
      distance_meters: distance,
      location_verified: locationVerified,
      status: status,
      rejection_reason: rejectionReason,
      device_info: deviceInfo || {},
      ip_address: ipAddress,
      user_agent: userAgent
    }

    console.log('Creating attendance log:', logInsertData)

    const { data: logData, error: logError } = await supabase
      .from('attendance_logs')
      .insert(logInsertData)
      .select()
      .single()

    if (logError) {
      console.error('Error creating log:', logError)
      // Don't fail the request if log creation fails
      // The attendance was already marked successfully
    } else {
      console.log('Log created successfully:', logData)
    }

    return NextResponse.json({ 
      success: locationVerified,
      message: locationVerified ? 'Attendance marked successfully' : rejectionReason,
      attendanceId: attendanceId,
      logId: logData?.id
    })
  } catch (error: any) {
    console.error('Error in mark QR attendance:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
