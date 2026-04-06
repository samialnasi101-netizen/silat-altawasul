import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Plus, Building2 } from 'lucide-react';
import DeleteButton from '@/components/delete-button';

export default async function AdminCharitiesPage() {
  const charities = await prisma.charity.findMany({
    include: { _count: { select: { projects: true } } },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="section-header flex-col sm:flex-row gap-3">
        <div>
          <h1 className="section-title text-xl sm:text-2xl">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
            الجمعيات
          </h1>
          <p className="section-subtitle">{charities.length} جمعية</p>
        </div>
        <Link href="/admin/charities/new" className="btn-primary text-sm sm:text-base">
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          إضافة جمعية
        </Link>
      </div>

      {/* Desktop table */}
      <div className="glass-card overflow-hidden p-0 hidden md:block">
        <div className="overflow-x-auto">
          <table className="table-glass">
            <thead>
              <tr>
                <th>الاسم</th>
                <th>الوصف</th>
                <th>المشاريع</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {charities.map((c) => (
                <tr key={c.id}>
                  <td className="text-white font-medium text-sm">{c.name}</td>
                  <td className="text-white/60 text-sm max-w-xs truncate">{c.description ?? '—'}</td>
                  <td className="text-white/80 text-sm">{c._count.projects}</td>
                  <td>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/admin/charities/${c.id}`} className="btn-ghost text-xs">تعديل</Link>
                      <DeleteButton endpoint={`/api/charities/${c.id}`} itemLabel="الجمعية" />
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
        {charities.map((c) => (
          <div key={c.id} className="glass-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{c.name}</p>
                {c.description && <p className="text-white/50 text-sm truncate">{c.description}</p>}
              </div>
              <span className="pill-active">{c._count.projects} مشروع</span>
            </div>
            <div className="flex items-center gap-2 pt-2" style={{ borderTop: '1px solid var(--feed-border)' }}>
              <Link href={`/admin/charities/${c.id}`} className="btn-ghost text-xs">تعديل</Link>
              <DeleteButton endpoint={`/api/charities/${c.id}`} itemLabel="الجمعية" />
            </div>
          </div>
        ))}
      </div>

      {charities.length === 0 && (
        <div className="glass-card">
          <div className="empty-state">
            <Building2 className="empty-state-icon" />
            <p className="empty-state-text">لا توجد جمعيات</p>
            <p className="empty-state-hint">أضف جمعية جديدة للبدء</p>
          </div>
        </div>
      )}
    </div>
  );
}
