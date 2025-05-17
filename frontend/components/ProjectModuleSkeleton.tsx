export default function ProjectModuleSkeleton() {
    return (
      <div className="animate-pulse rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <div className="h-4 w-40 bg-gray-200 rounded" />
            <div className="h-3 w-24 bg-gray-200 rounded" />
          </div>
          <div className="h-6 w-12 bg-gray-200 rounded" />
        </div>
        <div className="h-3 w-2/3 bg-gray-200 rounded" />
      </div>
    )
  }
  