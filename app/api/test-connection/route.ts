import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Test 1: Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // Test 2: Try to query the table directly
    const { data: tableData, error: tableError } = await supabase
      .from('attendance_sessions')
      .select('count')
      .limit(1)
    
    // Test 3: Check if we can access any table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    return NextResponse.json({
      auth: {
        user: user?.id || null,
        error: authError?.message || null
      },
      attendance_sessions: {
        accessible: !tableError,
        error: tableError?.message || null,
        data: tableData
      },
      profiles: {
        accessible: !profileError,
        error: profileError?.message || null
      },
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}
