import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Mail, Building, Hash } from "lucide-react"

export default async function StudentsPage() {
  const supabase = await createClient()

  const { data: students } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "student")
    .order("full_name")

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Students</h1>
        <p className="text-muted-foreground mt-1">View all registered students</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Students
          </CardTitle>
          <CardDescription>
            {students?.length || 0} students registered in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {students && students.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="p-4 border rounded-lg bg-muted/30 space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-semibold text-primary">
                        {student.full_name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{student.full_name}</p>
                      {student.student_id && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          {student.student_id}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5" />
                      {student.email}
                    </p>
                    {student.department && (
                      <p className="text-muted-foreground flex items-center gap-2">
                        <Building className="h-3.5 w-3.5" />
                        {student.department}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No students registered yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
