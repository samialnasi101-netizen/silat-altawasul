export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="h-8 w-40 bg-white/10 rounded-lg animate-pulse" />
      <div className="glass-card p-0 overflow-hidden">
        <div className="space-y-0">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4 p-4 border-b border-white/5">
              <div className="h-4 w-20 bg-white/10 rounded animate-pulse" />
              <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
              <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
              <div className="h-4 w-16 bg-white/10 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
