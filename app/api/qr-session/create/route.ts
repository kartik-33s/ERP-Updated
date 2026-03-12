import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      subject,
      section,
      lectureDate,
      lectureTime,
      lectureNumber,
      latitude,
      longitude,
      radiusMeters = 100,
      durationMinutes = 15
    } = body

    // Validate required fields
    if (!subject || !section || !lectureDate || !lectureTime || !lectureNumber || !latitude || !longitude) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Generate session data
    const lectureId = crypto.randomUUID()
    const sessionCode = Math.random().toString(36).substring(2, 10).toUpperCase()
    const startsAt = new Date().toISOString()
    const expiresAt = new Date(Date.now() + durationMinutes * 60000).toISOString()

    // Insert session directly
    const { data: sessionData, error: sessionError } = await supabase
      .from('attendance_sessions')
      .insert({
        lecture_id: lectureId,
        teacher_id: user.id,
        session_code: sessionCode,
        subject: subject,
        section: section,
        lecture_date: lectureDate,
        lecture_time: lectureTime,
        lecture_number: lectureNumber,
        latitude: latitude,
        longitude: longitude,
        radius_meters: radiusMeters,
        starts_at: startsAt,
        expires_at: expiresAt,
        is_active: true
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Error creating QR session:', sessionError)
      return NextResponse.json({ error: sessionError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      session: {
        session_id: sessionData.id,
        session_code: sessionData.session_code,
        lecture_id: sessionData.lecture_id
      }
    })
  } catch (error: any) {
    console.error('Error in create QR session:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
