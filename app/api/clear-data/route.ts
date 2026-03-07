import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()

    // Delete in order to respect foreign key constraints
    const tables = ['attendance', 'lectures', 'students', 'classes']
    const results = []

    for (const table of tables) {
      const { error, count } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all rows

      if (error) {
        console.error(`Error deleting from ${table}:`, error)
        results.push({ table, status: 'error', error: error.message })
      } else {
        results.push({ table, status: 'success', deletedCount: count })
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Data cleared successfully',
      results 
    })
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
