import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Plus, MapPin } from 'lucide-react';
import DeleteButton from '@/components/delete-button';

export default async function AdminBranchesPage() {
  const branches = await prisma.branch.findMany({
    include: { _count: { select: { users: true, branchProjects: true } } },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="section-header flex-col sm:flex-row gap-3">
        <div>
          <h1 className="section-title text-xl sm:text-2xl">
            <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
            الفروع
          </h1>
          <p className="section-subtitle">{branches.length} فرع</p>
        </div>
        <Link href="/admin/branches/new" className="btn-primary text-sm sm:text-base">
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          إضافة فرع
        </Link>
      </div>

      {/* Desktop table */}
      <div className="glass-card overflow-hidden p-0 hidden md:block">
        <div className="overflow-x-auto">
          <table className="table-glass">
            <thead>
              <tr>
                <th>الاسم</th>
                <th>الموقع</th>
                <th>موظفين</th>
                <th>مشاريع</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((b) => (
                <tr key={b.id}>
                  <td className="text-white font-medium text-sm">{b.name}</td>
                  <td className="text-white/60 text-sm">{b.location ?? '—'}</td>
                  <td className="text-white/80 text-sm">{b._count.users}</td>
                  <td className="text-white/80 text-sm">{b._count.branchProjects}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/branches/${b.id}`} className="btn-ghost text-xs">تعديل</Link>
                      <DeleteButton endpoint={`/api/branches/${b.id}`} itemLabel="الفرع" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-3">
        {branches.map((b) => (
          <div key={b.id} className="glass-card p-4 space-y-3">
            <p className="text-white font-medium">{b.name}</p>
            <p className="text-white/50 text-sm">{b.location ?? 'بدون موقع'}</p>
            <div className="flex gap-4 text-sm text-white/60">
              <span>{b._count.users} موظف</span>
              <span>{b._count.branchProjects} مشروع</span>
            </div>
            <div className="flex items-center gap-2 pt-2" style={{ borderTop: '1px solid var(--feed-border)' }}>
              <Link href={`/admin/branches/${b.id}`} className="btn-ghost text-xs">تعديل</Link>
              <DeleteButton endpoint={`/api/branches/${b.id}`} itemLabel="الفرع" />
            </div>
          </div>
        ))}
      </div>

      {branches.length === 0 && (
        <div className="glass-card">
          <div className="empty-state">
            <MapPin className="empty-state-icon" />
            <p className="empty-state-text">لا توجد فروع</p>
            <p className="empty-state-hint">أضف فرعًا من الزر أعلاه</p>
          </div>
        </div>
      )}
    </div>
  );
}
