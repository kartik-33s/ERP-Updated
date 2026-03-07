// Script to check profile data in database
// Run with: npx tsx scripts/check-profiles.ts

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkProfiles() {
  console.log('🔍 Checking profiles in database...\n')

  // Fetch all student profiles
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'student')
    .order('student_id', { ascending: true })

  if (error) {
    console.error('❌ Error fetching profiles:', error.message)
    return
  }

  if (!profiles || profiles.length === 0) {
    console.log('⚠️  No student profiles found in database')
    return
  }

  console.log(`✅ Found ${profiles.length} student profile(s):\n`)

  profiles.forEach((profile, index) => {
    console.log(`${index + 1}. ${profile.full_name || 'No name'}`)
    console.log(`   Roll No: ${profile.student_id || 'Not set'}`)
    console.log(`   Section: ${profile.section || 'Not set'}`)
    console.log(`   Email: ${profile.email || 'Not set'}`)
    console.log(`   Department: ${profile.department || 'Not set'}`)
    console.log(`   ID: ${profile.id}`)
    console.log('')
  })

  // Check section distribution
  const sectionA = profiles.filter(p => p.section === 'A').length
  const sectionB = profiles.filter(p => p.section === 'B').length
  const noSection = profiles.filter(p => !p.section).length

  console.log('📊 Section Distribution:')
  console.log(`   Section A: ${sectionA} students`)
  console.log(`   Section B: ${sectionB} students`)
  console.log(`   No Section: ${noSection} students`)
}

checkProfiles().catch(console.error)
