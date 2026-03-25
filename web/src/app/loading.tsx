export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F8F5FF] flex items-center justify-center px-4">
      <div className="w-full max-w-7xl space-y-6 animate-pulse">
        <div className="h-10 bg-gray-200 rounded-full w-2/3 mx-auto" />
        <div className="h-5 bg-gray-200 rounded-full w-1/2 mx-auto" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-white border border-gray-100 p-6 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
              <div className="h-3 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-200 rounded w-5/6" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
