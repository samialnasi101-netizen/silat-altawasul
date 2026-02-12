import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import DeleteButton from '@/components/delete-button';

export default async function AdminCharitiesPage() {
  const charities = await prisma.charity.findMany({
    include: { _count: { select: { projects: true } } },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">الجمعيات</h1>
        <Link href="/admin/charities/new" className="btn-primary">
          <Plus className="w-5 h-5" />
          إضافة جمعية
        </Link>
      </div>
      <div className="glass-card overflow-hidden p-0">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-right text-white/70 text-sm">
              <th className="p-4">الاسم</th>
              <th className="p-4">الوصف</th>
              <th className="p-4">المشاريع</th>
              <th className="p-4">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {charities.map((c) => (
              <tr key={c.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="p-4 text-white font-medium">{c.name}</td>
                <td className="p-4 text-white/80 max-w-xs truncate">{c.description ?? '—'}</td>
                <td className="p-4 text-white/80">{c._count.projects}</td>
                <td className="p-4 min-w-[180px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/charities/${c.id}`} className="btn-ghost text-sm shrink-0">
                      تعديل
                    </Link>
                    <DeleteButton endpoint={`/api/charities/${c.id}`} itemLabel="الجمعية" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {charities.length === 0 && (
          <p className="p-8 text-center text-white/60">لا توجد جمعيات.</p>
        )}
      </div>
    </div>
  );
}
