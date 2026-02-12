import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import DeleteButton from '@/components/delete-button';

export default async function AdminBranchesPage() {
  const branches = await prisma.branch.findMany({
    include: { _count: { select: { users: true, branchProjects: true } } },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">الفروع</h1>
        <Link href="/admin/branches/new" className="btn-primary">
          <Plus className="w-5 h-5" />
          إضافة فرع
        </Link>
      </div>
      <div className="glass-card overflow-hidden p-0">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-right text-white/70 text-sm">
              <th className="p-4">الاسم</th>
              <th className="p-4">الموقع</th>
              <th className="p-4">موظفين</th>
              <th className="p-4">مشاريع</th>
              <th className="p-4">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {branches.map((b) => (
              <tr key={b.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="p-4 text-white font-medium">{b.name}</td>
                <td className="p-4 text-white/80">{b.location ?? '—'}</td>
                <td className="p-4 text-white/80">{b._count.users}</td>
                <td className="p-4 text-white/80">{b._count.branchProjects}</td>
                <td className="p-4 flex items-center gap-3">
                  <Link href={`/admin/branches/${b.id}`} className="btn-ghost text-sm">
                    تعديل
                  </Link>
                  <DeleteButton endpoint={`/api/branches/${b.id}`} itemLabel="الفرع" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {branches.length === 0 && (
          <p className="p-8 text-center text-white/60">لا توجد فروع. أضف فرعًا من الزر أعلاه.</p>
        )}
      </div>
    </div>
  );
}
