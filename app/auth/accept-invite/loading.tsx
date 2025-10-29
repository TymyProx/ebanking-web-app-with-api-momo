export default function AcceptInviteLoading() {
  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Left side - Hero Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div className="relative w-full h-full p-8">
          <div className="relative w-full h-full overflow-hidden rounded-2xl shadow-lg border backdrop-blur-sm bg-gray-200 animate-pulse">
            <div className="absolute top-12 left-6 z-10">
              <div className="w-[150px] h-[50px] bg-gray-300 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Loading Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo Skeleton */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="w-[150px] h-[50px] bg-gray-300 rounded animate-pulse" />
          </div>

          {/* Welcome Text Skeleton */}
          <div className="space-y-2">
            <div className="h-12 w-64 bg-gray-300 rounded animate-pulse" />
            <div className="h-10 w-80 bg-gray-300 rounded animate-pulse" />
          </div>

          {/* Form Skeleton */}
          <div className="space-y-6">
            <div className="h-8 w-48 bg-gray-300 rounded animate-pulse" />

            <div className="space-y-5">
              {/* Email Field Skeleton */}
              <div className="space-y-2">
                <div className="h-4 w-16 bg-gray-300 rounded animate-pulse" />
                <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse" />
              </div>

              {/* First Name Field Skeleton */}
              <div className="space-y-2">
                <div className="h-4 w-16 bg-gray-300 rounded animate-pulse" />
                <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse" />
              </div>

              {/* Last Name Field Skeleton */}
              <div className="space-y-2">
                <div className="h-4 w-16 bg-gray-300 rounded animate-pulse" />
                <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse" />
              </div>

              {/* Password Field Skeleton */}
              <div className="space-y-2">
                <div className="h-4 w-24 bg-gray-300 rounded animate-pulse" />
                <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse" />
              </div>

              {/* Confirm Password Field Skeleton */}
              <div className="space-y-2">
                <div className="h-4 w-40 bg-gray-300 rounded animate-pulse" />
                <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse" />
              </div>

              {/* Submit Button Skeleton */}
              <div className="h-12 w-full bg-gradient-to-r from-[hsl(45,93%,47%)] to-[hsl(123,38%,57%)] opacity-50 rounded-lg animate-pulse" />
            </div>
          </div>

          {/* Footer Skeleton */}
          <div className="pt-8 text-center">
            <div className="h-4 w-64 mx-auto bg-gray-300 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
