import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()

    // Note: This requires admin privileges
    // First, get all users
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
      return NextResponse.json({ 
        error: 'Failed to list users: ' + listError.message 
      }, { status: 500 })
    }

    // Delete each user
    const results = []
    for (const user of users || []) {
      const { error } = await supabase.auth.admin.deleteUser(user.id)
      if (error) {
        results.push({ id: user.id, email: user.email, status: 'error', error: error.message })
      } else {
        results.push({ id: user.id, email: user.email, status: 'deleted' })
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Deleted ${results.filter(r => r.status === 'deleted').length} users`,
      results 
    })
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
