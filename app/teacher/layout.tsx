import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { TeacherNav } from "@/components/teacher-nav"

export default async function TeacherLayout({
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

  if (!profile || profile.role !== "teacher") {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <TeacherNav profile={profile} />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
