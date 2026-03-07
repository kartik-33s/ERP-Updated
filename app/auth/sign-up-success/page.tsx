import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-accent rounded-full">
              <CheckCircle2 className="h-8 w-8 text-accent-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Account Created!</CardTitle>
          <CardDescription>
            Please check your email to confirm your account before signing in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            We sent a confirmation link to your email address. Click the link to activate your account.
          </p>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full">
            <Link href="/auth/login">Go to Login</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
