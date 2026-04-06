import { prisma } from "@/lib/prisma";
import { Suspense } from "react";
import { formatTimeSaudi } from "@/lib/saudi-time";
import { ClipboardList, AlertTriangle, MapPin } from "lucide-react";
import AttendanceDateFilter from "./attendance-date-filter";

function getDayRange(dateStr: string | null) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const t = new Date();
    const start = new Date(t.getFullYear(), t.getMonth(), t.getDate(), 0, 0, 0, 0);
    const end = new Date(t.getFullYear(), t.getMonth(), t.getDate(), 23, 59, 59, 999);
    return { start, end, label: dateStr || null };
  }
  const [y, m, d] = dateStr.split("-").map(Number);
  const start = new Date(y, m - 1, d, 0, 0, 0, 0);
  const end = new Date(y, m - 1, d, 23, 59, 59, 999);
  return { start, end, label: dateStr };
}

export default async function AdminAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const { start, end, label } = getDayRange(dateParam ?? null);

  const records = await prisma.attendanceRecord.findMany({
    where: { checkInAt: { gte: start, lte: end } },
    include: { user: { include: { branch: { select: { name: true } } } } },
    orderBy: { checkInAt: "desc" },
  });

  const suspiciousCount = records.filter((r) => r.suspicious).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="section-header flex-col sm:flex-row gap-3">
        <div>
          <h1 className="section-title text-xl sm:text-2xl">
            <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
            سجل الحضور
          </h1>
          <div className="flex items-center gap-3 mt-1">
            {label && <p className="section-subtitle mt-0">يوم {label}</p>}
            {suspiciousCount > 0 && (
              <span className="pill-warning">
                <AlertTriangle className="w-3 h-3" />
                {suspiciousCount} مشبوه
              </span>
            )}
          </div>
        </div>
        <Suspense fallback={<div className="h-10 w-44 bg-white/5 rounded-xl animate-pulse" />}>
          <AttendanceDateFilter />
        </Suspense>
      </div>

      {/* Desktop table */}
      <div className="glass-card overflow-hidden p-0 hidden lg:block">
        <div className="overflow-x-auto">
          <table className="table-glass">
            <thead>
              <tr>
                <th>الموظف</th>
                <th>الفرع</th>
                <th>دخول</th>
                <th>خروج</th>
                <th>الدقة</th>
                <th>سبب التأخر</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className={r.suspicious ? 'bg-amber-500/5' : ''}>
                  <td className="text-white/80 text-sm">{r.user.name}</td>
                  <td className="text-white/60 text-sm">{r.user.branch?.name ?? "-"}</td>
                  <td className="text-white/80 text-sm whitespace-nowrap">{formatTimeSaudi(new Date(r.checkInAt))}</td>
                  <td className="text-white/80 text-sm whitespace-nowrap">
                    {r.checkOutAt ? formatTimeSaudi(new Date(r.checkOutAt)) : <span className="pill-active">حاضر</span>}
                  </td>
                  <td className="text-sm whitespace-nowrap">
                    {r.accuracy != null ? (
                      <span className={`flex items-center gap-1 ${r.accuracy < 3 ? 'text-red-400' : r.accuracy < 10 ? 'text-amber-400' : 'text-white/50'}`}>
                        <MapPin className="w-3 h-3" />
                        {r.accuracy.toFixed(0)}م
                      </span>
                    ) : (
                      <span className="text-white/20">—</span>
                    )}
                  </td>
                  <td className="text-white/60 text-sm max-w-[180px] truncate" title={r.checkInLateReason?.trim() || undefined}>
                    {r.checkInLateReason?.trim() || "-"}
                  </td>
                  <td>
                    {r.suspicious ? (
                      <span className="pill-warning cursor-help" title={r.suspiciousReason || 'مشبوه'}>
                        <AlertTriangle className="w-3 h-3" />
                        مشبوه
                      </span>
                    ) : (
                      <span className="text-white/20 text-xs">طبيعي</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile/tablet card view */}
      <div className="lg:hidden space-y-3">
        {records.map((r) => (
          <div key={r.id} className={`glass-card p-4 space-y-2 ${r.suspicious ? 'border-amber-500/30' : ''}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-white font-medium text-sm">{r.user.name}</p>
                <p className="text-white/50 text-xs">{r.user.branch?.name ?? "-"}</p>
              </div>
              <div className="flex items-center gap-2">
                {r.suspicious && (
                  <span className="pill-warning" title={r.suspiciousReason || ''}>
                    <AlertTriangle className="w-3 h-3" />
                  </span>
                )}
                {!r.checkOutAt && <span className="pill-active">حاضر</span>}
              </div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/60">
              <span>دخول: {formatTimeSaudi(new Date(r.checkInAt))}</span>
              {r.checkOutAt && <span>خروج: {formatTimeSaudi(new Date(r.checkOutAt))}</span>}
              {r.accuracy != null && (
                <span className={r.accuracy < 3 ? 'text-red-400' : ''}>
                  دقة: {r.accuracy.toFixed(0)}م
                </span>
              )}
            </div>
            {r.checkInLateReason && (
              <p className="text-xs text-amber-400/80">تأخر: {r.checkInLateReason.trim()}</p>
            )}
            {r.suspicious && r.suspiciousReason && (
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-amber-300">{r.suspiciousReason}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {records.length === 0 && (
        <div className="glass-card">
          <div className="empty-state py-12">
            <ClipboardList className="empty-state-icon w-12 h-12" />
            <p className="empty-state-text">لا توجد سجلات حضور في هذا التاريخ</p>
          </div>
        </div>
      )}
    </div>
  );
}
