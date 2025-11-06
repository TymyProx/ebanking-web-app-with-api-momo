export default function RootLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
      <div className="text-center space-y-4">
        <div className="relative w-16 h-16 mx-auto">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="space-y-2">
          <div className="h-6 w-48 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg animate-pulse mx-auto" />
          <div className="h-4 w-32 bg-muted/50 rounded-lg animate-pulse mx-auto" />
        </div>
      </div>
    </div>
  )
}
