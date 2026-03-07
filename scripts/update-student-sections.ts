import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function updateStudentSections() {
  console.log('Starting student section update...')

  // Get all students
  const { data: students, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'student')

  if (fetchError) {
    console.error('Error fetching students:', fetchError)
    return
  }

  console.log(`Found ${students?.length || 0} students`)

  // Update each student's section based on roll number
  for (const student of students || []) {
    const rollNo = parseInt(student.student_id)
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
      console.log(`Updated ${student.full_name} (${student.student_id}) -> Section ${section}`)
    }
  }

  console.log('Student section update complete!')
}

updateStudentSections()
