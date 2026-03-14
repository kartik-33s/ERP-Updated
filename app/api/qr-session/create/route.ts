import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    console.log('Create session - Auth check:', { user: user?.id, authError })

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log('Create session - Request body:', body)

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
      console.error('Create session - Missing fields:', { subject, section, lectureDate, lectureTime, lectureNumber, latitude, longitude })
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Generate session data
    const lectureId = crypto.randomUUID()
    const sessionCode = Math.random().toString(36).substring(2, 10).toUpperCase()
    const startsAt = new Date().toISOString()
    const expiresAt = new Date(Date.now() + durationMinutes * 60000).toISOString()

    console.log('Create session - Generated data:', { lectureId, sessionCode, startsAt, expiresAt })

    // First, create or get the lecture
    const { data: existingLecture, error: existingLectureError } = await supabase
      .from('lectures')
      .select('id')
      .eq('teacher_id', user.id)
      .eq('subject', subject)
      .eq('section', section)
      .eq('lecture_date', lectureDate)
      .eq('lecture_number', lectureNumber)
      .single()

    console.log('Create session - Existing lecture check:', { existingLecture, existingLectureError })

    const finalLectureId = existingLecture?.id || lectureId

    // If lecture doesn't exist, create it
    if (!existingLecture) {
      const { data: newLecture, error: lectureError } = await supabase
        .from('lectures')
        .insert({
          id: lectureId,
          teacher_id: user.id,
          subject: subject,
          section: section,
          lecture_date: lectureDate,
          lecture_time: lectureTime,
          lecture_number: lectureNumber
        })
        .select()
        .single()

      console.log('Create session - New lecture created:', { newLecture, lectureError })

      if (lectureError) {
        console.error('Create session - Lecture creation error:', lectureError)
        // Continue anyway - the session might work without the lecture
      }
    }

    const sessionInsertData = {
      lecture_id: finalLectureId,
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
    }

    console.log('Create session - Inserting session:', sessionInsertData)

    // Insert session directly
    const { data: sessionData, error: sessionError } = await supabase
      .from('attendance_sessions')
      .insert(sessionInsertData)
      .select()
      .single()

    console.log('Create session - Insert result:', { sessionData, sessionError })

    if (sessionError) {
      console.error('Create session - Session creation error:', sessionError)
      return NextResponse.json({ error: sessionError.message, details: sessionError }, { status: 500 })
    }

    // Verify the session was actually saved
    const { data: verifySession, error: verifyError } = await supabase
      .from('attendance_sessions')
      .select('*')
      .eq('session_code', sessionCode)
      .single()

    console.log('Create session - Verification:', { verifySession, verifyError })

    if (!verifySession) {
      console.error('Create session - Session not found after insert!')
      return NextResponse.json({ 
        error: 'Session created but not found in database',
        sessionCode: sessionCode
      }, { status: 500 })
    }

    console.log('Create session - Success! Session created and verified:', sessionData)

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
