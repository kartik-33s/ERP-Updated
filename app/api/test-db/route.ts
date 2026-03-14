import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Test 1: Check if we can read from attendance_sessions
    const { data: sessions, error: readError } = await supabase
      .from('attendance_sessions')
      .select('*')
      .limit(5)

    // Test 2: Try to insert a test session
    const testSessionCode = 'TEST' + Math.random().toString(36).substring(2, 6).toUpperCase()
    const { data: insertData, error: insertError } = await supabase
      .from('attendance_sessions')
      .insert({
        lecture_id: crypto.randomUUID(),
        teacher_id: user.id,
        session_code: testSessionCode,
        subject: 'TEST',
        section: 'A',
        lecture_date: new Date().toISOString().split('T')[0],
        lecture_time: '09:00',
        lecture_number: 1,
        latitude: 0,
        longitude: 0,
        radius_meters: 100,
        starts_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 15 * 60000).toISOString(),
        is_active: true
      })
      .select()

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      tests: {
        read: {
          success: !readError,
          error: readError?.message,
          count: sessions?.length || 0
        },
        insert: {
          success: !insertError,
          error: insertError?.message,
          errorDetails: insertError,
          data: insertData
        }
      }
    })
  } catch (error: any) {
    return NextResponse.json({ 
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
