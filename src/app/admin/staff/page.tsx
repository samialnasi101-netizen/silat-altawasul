import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Plus, Users } from 'lucide-react';
import StaffStatusButton from '@/components/staff-status-button';
import StaffDeleteButton from '@/components/staff-delete-button';

export default async function AdminStaffPage() {
  const staff = await prisma.user.findMany({
    where: { role: 'STAFF' },
    include: { branch: { select: { name: true } } },
    orderBy: { name: 'asc' },
  });

  const activeCount = staff.filter((u) => u.active).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="section-header flex-col sm:flex-row gap-3">
        <div>
          <h1 className="section-title text-xl sm:text-2xl">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
            الموظفين
          </h1>
          <p className="section-subtitle">{staff.length} موظف — {activeCount} نشط</p>
        </div>
        <Link href="/admin/staff/new" className="btn-primary text-sm sm:text-base">
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          إضافة موظف
        </Link>
      </div>

      {/* Desktop table */}
      <div className="glass-card overflow-hidden p-0 hidden lg:block">
        <div className="overflow-x-auto">
          <table className="table-glass">
            <thead>
              <tr>
                <th>المعرف</th>
                <th>الاسم</th>
                <th>الفرع</th>
                <th>الدوام</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((u) => (
                <tr key={u.id}>
                  <td className="text-white font-medium text-sm">{u.staffId}</td>
                  <td className="text-white/80 text-sm">{u.name}</td>
                  <td className="text-white/60 text-sm">{u.branch?.name ?? <span className="text-white/30">—</span>}</td>
                  <td className="text-white/60 text-sm">{u.workStart && u.workEnd ? `${u.workStart} - ${u.workEnd}` : <span className="text-white/30">—</span>}</td>
                  <td>
                    {u.active ? <span className="pill-active">نشط</span> : <span className="pill-inactive">معطّل</span>}
                  </td>
                  <td>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/admin/staff/${u.id}`} className="btn-ghost text-xs">تعديل</Link>
                      <StaffStatusButton staffId={u.id} active={u.active} />
                      <StaffDeleteButton staffId={u.id} staffName={u.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile/tablet card view */}
      <div className="lg:hidden space-y-3">
        {staff.map((u) => (
          <div key={u.id} className="glass-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{u.name}</p>
                <p className="text-white/50 text-sm">{u.staffId}</p>
              </div>
              {u.active ? <span className="pill-active">نشط</span> : <span className="pill-inactive">معطّل</span>}
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-white/60">
              <span>الفرع: {u.branch?.name ?? '—'}</span>
              <span>الدوام: {u.workStart && u.workEnd ? `${u.workStart} - ${u.workEnd}` : '—'}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1" style={{ borderTop: '1px solid var(--feed-border)' }}>
              <Link href={`/admin/staff/${u.id}`} className="btn-ghost text-xs">تعديل</Link>
              <StaffStatusButton staffId={u.id} active={u.active} />
              <StaffDeleteButton staffId={u.id} staffName={u.name} />
            </div>
          </div>
        ))}
      </div>

      {staff.length === 0 && (
        <div className="glass-card">
          <div className="empty-state">
            <Users className="empty-state-icon" />
            <p className="empty-state-text">لا يوجد موظفين</p>
            <p className="empty-state-hint">أضف موظفاً جديداً للبدء</p>
          </div>
        </div>
      )}
    </div>
  );
}
