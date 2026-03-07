import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { FileCheck, Eye, Filter } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function ODRequestsPage() {
  const supabase = await createClient()

  const { data: odRequests } = await supabase
    .from("od_requests")
    .select("*, profiles!od_requests_student_id_fkey(full_name, student_id, department)")
    .order("created_at", { ascending: false })

  const pendingRequests = odRequests?.filter(r => r.status === "pending") || []
  const approvedRequests = odRequests?.filter(r => r.status === "approved") || []
  const rejectedRequests = odRequests?.filter(r => r.status === "rejected") || []

  function getStatusBadge(status: string) {
    switch (status) {
      case "approved":
        return <Badge className="bg-accent text-accent-foreground">Approved</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="secondary">Pending</Badge>
    }
  }

  function RequestList({ requests }: { requests: typeof odRequests }) {
    if (!requests || requests.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No requests in this category</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {requests.map((request) => (
          <div
            key={request.id}
            className="flex items-center justify-between p-4 border rounded-lg bg-muted/30"
          >
            <div className="space-y-1 flex-1">
              <p className="font-medium text-foreground">{request.event_name}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{request.profiles?.full_name}</span>
                {request.profiles?.student_id && (
                  <span>ID: {request.profiles.student_id}</span>
                )}
                {request.profiles?.department && (
                  <span>{request.profiles.department}</span>
                )}
                <span>
                  {new Date(request.event_date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1">{request.reason}</p>
            </div>
            <div className="flex items-center gap-4 ml-4">
              {getStatusBadge(request.status)}
              <Button asChild size="sm" variant={request.status === "pending" ? "default" : "outline"}>
                <Link href={`/teacher/od-requests/${request.id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  {request.status === "pending" ? "Review" : "View"}
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">OD Requests</h1>
        <p className="text-muted-foreground mt-1">Review and manage student On Duty requests</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            All Requests
          </CardTitle>
          <CardDescription>Filter by status to find specific requests</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                Pending
                {pendingRequests.length > 0 && (
                  <Badge variant="secondary" className="ml-1">{pendingRequests.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved">
                Approved
                {approvedRequests.length > 0 && (
                  <Badge variant="secondary" className="ml-1">{approvedRequests.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected
                {rejectedRequests.length > 0 && (
                  <Badge variant="secondary" className="ml-1">{rejectedRequests.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="pending">
              <RequestList requests={pendingRequests} />
            </TabsContent>
            <TabsContent value="approved">
              <RequestList requests={approvedRequests} />
            </TabsContent>
            <TabsContent value="rejected">
              <RequestList requests={rejectedRequests} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
