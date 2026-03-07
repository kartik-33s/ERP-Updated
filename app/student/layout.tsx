import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { StudentNav } from "@/components/student-nav"

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "student") {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <StudentNav profile={profile} />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
