import { Suspense } from "react"
import RIBContent from "./rib-content"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

function RIBSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-96" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

export default function RIBPage() {
  return (
    <Suspense fallback={<RIBSkeleton />}>
      <RIBContent />
    </Suspense>
  )
}
