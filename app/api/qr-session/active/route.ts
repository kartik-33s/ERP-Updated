import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ 
        success: false,
        error: "Unauthorized",
        session: null 
      }, { status: 401 })
    }

    // Get active session with statistics
    const { data: sessions, error: sessionError } = await supabase
      .from('attendance_sessions')
      .select(`
        id,
        session_code,
        subject,
        section,
        lecture_number,
        starts_at,
        expires_at
      `)
      .eq('teacher_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)

    if (sessionError) {
      console.error('Error fetching active session:', sessionError)
      return NextResponse.json({ 
        success: false,
        error: sessionError.message,
        session: null 
      }, { status: 500 })
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ 
        success: true,
        session: null
      })
    }

    const session = sessions[0]

    // Check if still valid
    const now = new Date()
    const expiresAt = new Date(session.expires_at)
    if (now > expiresAt) {
      return NextResponse.json({ 
        success: true,
        session: null
      })
    }

    // Get scan statistics
    const { data: logs } = await supabase
      .from('attendance_logs')
      .select('id, status')
      .eq('session_id', session.id)

    const totalScans = logs?.length || 0
    const successfulScans = logs?.filter(l => l.status === 'present').length || 0

    return NextResponse.json({ 
      success: true,
      session: {
        session_id: session.id,
        session_code: session.session_code,
        subject: session.subject,
        section: session.section,
        lecture_number: session.lecture_number,
        starts_at: session.starts_at,
        expires_at: session.expires_at,
        total_scans: totalScans,
        successful_scans: successfulScans
      }
    })
  } catch (error: any) {
    console.error('Error in get active session:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message,
      session: null 
    }, { status: 500 })
  }
}
