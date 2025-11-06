export default function DashboardLoading() {
  return (
    <div className="space-y-8 fade-in">
      <div className="space-y-2">
        <div className="h-9 w-64 bg-gradient-to-r from-muted to-muted/50 rounded-lg animate-pulse" />
        <div className="h-6 w-96 bg-muted/50 rounded-lg animate-pulse" />
      </div>

      {/* Accounts Carousel Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-gradient-to-br from-muted to-muted/50 rounded-xl animate-pulse" />
        ))}
      </div>

      {/* Quick Actions Skeleton */}
      <div className="border-0 shadow-lg rounded-xl p-6 bg-gradient-to-r from-muted/30 to-muted/20">
        <div className="h-6 w-48 bg-muted rounded-lg animate-pulse mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>

      {/* Transactions and Products Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="border-0 shadow-lg rounded-xl p-6 bg-card">
          <div className="h-6 w-48 bg-muted rounded-lg animate-pulse mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted/30 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-6 w-32 bg-muted rounded-lg animate-pulse" />
          <div className="h-64 bg-muted/30 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  )
}
