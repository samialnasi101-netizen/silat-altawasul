import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Plus, FolderKanban } from 'lucide-react';
import DeleteButton from '@/components/delete-button';

export default async function AdminProjectsPage() {
  const projects = await prisma.project.findMany({
    include: {
      charity: { select: { name: true } },
      _count: { select: { branchProjects: true } },
    },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="section-header flex-col sm:flex-row gap-3">
        <div>
          <h1 className="section-title text-xl sm:text-2xl">
            <FolderKanban className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
            المشاريع
          </h1>
          <p className="section-subtitle">{projects.length} مشروع</p>
        </div>
        <Link href="/admin/projects/new" className="btn-primary text-sm sm:text-base">
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          إضافة مشروع
        </Link>
      </div>

      {/* Desktop table */}
      <div className="glass-card overflow-hidden p-0 hidden md:block">
        <div className="overflow-x-auto">
          <table className="table-glass">
            <thead>
              <tr>
                <th>الاسم</th>
                <th>الجمعية</th>
                <th>عدد الفروع</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id}>
                  <td className="text-white font-medium text-sm">{p.name}</td>
                  <td className="text-white/60 text-sm">{p.charity.name}</td>
                  <td className="text-white/80 text-sm">{p._count.branchProjects}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/projects/${p.id}`} className="btn-ghost text-xs">تعديل</Link>
                      <DeleteButton endpoint={`/api/projects/${p.id}`} itemLabel="المشروع" />
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
        {projects.map((p) => (
          <div key={p.id} className="glass-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{p.name}</p>
                <p className="text-white/50 text-sm">{p.charity.name}</p>
              </div>
              <span className="pill-active">{p._count.branchProjects} فرع</span>
            </div>
            <div className="flex items-center gap-2 pt-2" style={{ borderTop: '1px solid var(--feed-border)' }}>
              <Link href={`/admin/projects/${p.id}`} className="btn-ghost text-xs">تعديل</Link>
              <DeleteButton endpoint={`/api/projects/${p.id}`} itemLabel="المشروع" />
            </div>
          </div>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="glass-card">
          <div className="empty-state">
            <FolderKanban className="empty-state-icon" />
            <p className="empty-state-text">لا توجد مشاريع</p>
            <p className="empty-state-hint">أضف مشروعاً جديداً للبدء</p>
          </div>
        </div>
      )}
    </div>
  );
}
