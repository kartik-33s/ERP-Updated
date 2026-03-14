import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Get all sessions (last 10)
    const { data: sessions } = await supabase
      .from('attendance_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      profile,
      sessions,
      currentTime: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Error in debug endpoint:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
