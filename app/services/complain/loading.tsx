export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-9 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="h-6 w-96 bg-gray-200 rounded animate-pulse" />
      </div>

      <div className="space-y-4">
        <div className="h-12 w-full bg-gray-200 rounded animate-pulse" />
        <div className="h-96 w-full bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  )
}
