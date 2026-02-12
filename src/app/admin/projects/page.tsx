import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Plus } from 'lucide-react';
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">المشاريع</h1>
        <Link href="/admin/projects/new" className="btn-primary">
          <Plus className="w-5 h-5" />
          إضافة مشروع
        </Link>
      </div>
      <div className="glass-card overflow-hidden p-0">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-right text-white/70 text-sm">
              <th className="p-4">الاسم</th>
              <th className="p-4">الجمعية</th>
              <th className="p-4">عدد الفروع</th>
              <th className="p-4">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="p-4 text-white font-medium">{p.name}</td>
                <td className="p-4 text-white/80">{p.charity.name}</td>
                <td className="p-4 text-white/80">{p._count.branchProjects}</td>
                <td className="p-4 flex items-center gap-3">
                  <Link href={`/admin/projects/${p.id}`} className="btn-ghost text-sm">
                    تعديل
                  </Link>
                  <DeleteButton endpoint={`/api/projects/${p.id}`} itemLabel="المشروع" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {projects.length === 0 && (
          <p className="p-8 text-center text-white/60">لا توجد مشاريع.</p>
        )}
      </div>
    </div>
  );
}
