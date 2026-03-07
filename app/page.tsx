import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, Users, ClipboardCheck, FileCheck } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">College ERP</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 text-balance">
            Attendance Management Made Simple
          </h1>
          <p className="text-lg text-muted-foreground mb-8 text-pretty">
            Streamline your college attendance tracking with our digital OD request system. 
            Students can submit requests, teachers can approve them, and attendance is automatically updated.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/auth/sign-up">Create Account</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold text-center mb-12 text-foreground">Key Features</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <div className="p-2 bg-primary/10 rounded-lg w-fit mb-2">
                  <FileCheck className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>OD Request System</CardTitle>
                <CardDescription>
                  Submit On Duty requests with event details and supporting documents for workshops, competitions, and seminars.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <div className="p-2 bg-primary/10 rounded-lg w-fit mb-2">
                  <ClipboardCheck className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Teacher Approval</CardTitle>
                <CardDescription>
                  Teachers can review requests, verify proof documents, and approve or reject with a single click.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <div className="p-2 bg-primary/10 rounded-lg w-fit mb-2">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Auto Attendance</CardTitle>
                <CardDescription>
                  Approved OD requests automatically mark students present, eliminating manual attendance corrections.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t bg-card">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>College ERP Attendance Management System</p>
        </div>
      </footer>
    </div>
  )
}
