export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="h-8 w-48 bg-white/10 rounded-lg animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card space-y-3">
            <div className="h-4 w-20 bg-white/10 rounded animate-pulse" />
            <div className="h-8 w-28 bg-white/10 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
