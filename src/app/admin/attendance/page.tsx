import { prisma } from "@/lib/prisma";
import { Suspense } from "react";
import { formatDateSaudi, formatTimeSaudi } from "@/lib/saudi-time";
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
    where: {
      checkInAt: { gte: start, lte: end },
    },
    include: { user: { include: { branch: { select: { name: true } } } } },
    orderBy: { checkInAt: "desc" },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">سجل الحضور</h1>
        <Suspense fallback={<div className="h-10 w-44 bg-white/5 rounded-xl animate-pulse" />}>
          <AttendanceDateFilter />
        </Suspense>
      </div>
      {label && (
        <p className="text-white/70 text-sm">
          عرض سجلات يوم: <span className="text-white font-medium">{label}</span>
        </p>
      )}
      <div className="glass-card overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-white/10 text-right text-white/70 text-sm">
              <th className="p-4">الموظف</th>
              <th className="p-4">الفرع</th>
              <th className="p-4">دخول</th>
              <th className="p-4">خروج</th>
              <th className="p-4">سبب التأخر</th>
              <th className="p-4">سبب الانصراف المبكر</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r: (typeof records)[number]) => (
              <tr key={r.id} className="border-b border-white/5">
                <td className="p-4 text-white/80">{r.user.name}</td>
                <td className="p-4 text-white/80">{r.user.branch?.name ?? "-"}</td>
                <td className="p-4 text-white/80">{formatDateSaudi(new Date(r.checkInAt))} {formatTimeSaudi(new Date(r.checkInAt))}</td>
                <td className="p-4 text-white/80">{r.checkOutAt ? `${formatDateSaudi(new Date(r.checkOutAt))} ${formatTimeSaudi(new Date(r.checkOutAt))}` : "- حاضر"}</td>
                <td className="p-4 text-white/80 max-w-[220px] break-words" title={r.checkInLateReason?.trim() || undefined}>
                  {r.checkInLateReason?.trim() || "-"}
                </td>
                <td className="p-4 text-white/80 max-w-[220px] break-words" title={r.checkOutEarlyReason?.trim() || undefined}>
                  {r.checkOutEarlyReason?.trim() || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {records.length === 0 && (
          <p className="p-8 text-center text-white/60">
            لا توجد سجلات حضور في هذا التاريخ
          </p>
        )}
      </div>
    </div>
  );
}
