import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()

    // Get all students
    const { data: students, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    const updates = []

    // Update each student's section based on roll number
    for (const student of students || []) {
      const rollNo = parseInt(student.student_id || '0')
      let section = 'A' // default

      if (rollNo >= 2320000 && rollNo <= 2320100) {
        section = 'A'
      } else if (rollNo >= 2320101 && rollNo <= 2320200) {
        section = 'B'
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ section })
        .eq('id', student.id)

      if (updateError) {
        console.error(`Error updating student ${student.student_id}:`, updateError)
      } else {
        updates.push({
          name: student.full_name,
          rollNo: student.student_id,
          section
        })
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Updated ${updates.length} students`,
      updates 
    })
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
