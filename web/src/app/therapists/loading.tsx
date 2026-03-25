export default function TherapistsLoading() {
  return (
    <div className="min-h-screen bg-[#F8F5FF]">
      {/* Header skeleton */}
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-2/3 mb-3" />
          <div className="h-5 bg-gray-200 rounded w-1/2" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        {/* Filter bar skeleton */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-8 h-24" />

        {/* Card grid skeleton */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
              <div className="flex items-start gap-4 mb-4">
                <div className="h-16 w-16 rounded-full bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-5 bg-gray-200 rounded-full w-16" />
                </div>
              </div>
              <div className="flex gap-2 mb-3">
                <div className="h-5 bg-gray-200 rounded-full w-16" />
                <div className="h-5 bg-gray-200 rounded-full w-20" />
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-5/6" />
              </div>
              <div className="flex gap-3 mt-auto pt-2">
                <div className="h-9 bg-gray-200 rounded-full flex-1" />
                <div className="h-9 bg-gray-200 rounded-full flex-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
