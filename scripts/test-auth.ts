// Test script to verify authentication
// Run with: npx tsx scripts/test-auth.ts

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAuth() {
  const testEmail = 'test@example.com'
  const testPassword = 'test123'

  console.log('🔍 Testing authentication...\n')

  // Test 1: Sign up
  console.log('1️⃣ Attempting sign up...')
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: {
        full_name: 'Test User',
        role: 'student',
        student_id: '2320050',
        department: 'Computer Science',
        section: 'A',
      },
    },
  })

  if (signUpError) {
    console.error('❌ Sign up error:', signUpError.message)
  } else {
    console.log('✅ Sign up successful!')
    console.log('   User ID:', signUpData.user?.id)
    console.log('   Email confirmed:', signUpData.user?.email_confirmed_at ? 'Yes' : 'No')
    console.log('   Identity confirmed:', signUpData.user?.confirmed_at ? 'Yes' : 'No')
  }

  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Test 2: Sign in
  console.log('\n2️⃣ Attempting sign in...')
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  })

  if (signInError) {
    console.error('❌ Sign in error:', signInError.message)
    console.log('\n💡 Possible reasons:')
    console.log('   - Email confirmation is required (check Supabase Auth settings)')
    console.log('   - User was not created successfully')
    console.log('   - Password is incorrect')
  } else {
    console.log('✅ Sign in successful!')
    console.log('   User ID:', signInData.user?.id)
    console.log('   Email:', signInData.user?.email)
  }

  // Test 3: Check profile
  if (signInData?.user) {
    console.log('\n3️⃣ Checking profile...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', signInData.user.id)
      .single()

    if (profileError) {
      console.error('❌ Profile error:', profileError.message)
    } else {
      console.log('✅ Profile found!')
      console.log('   Profile:', JSON.stringify(profile, null, 2))
    }
  }

  console.log('\n✨ Test complete!')
}

testAuth().catch(console.error)
