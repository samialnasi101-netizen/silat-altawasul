import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import StaffStatusButton from '@/components/staff-status-button';

type StaffRow = {
  id: string;
  staffId: string;
  name: string;
  workStart: string | null;
  workEnd: string | null;
  active: boolean | null;
  branchId: string | null;
  branch_name: string | null;
};

export default async function AdminStaffPage() {
  const staff = await prisma.$queryRaw<StaffRow[]>`
    SELECT u.id, u."staffId", u.name, u."workStart", u."workEnd", u.active, u."branchId", b.name as branch_name
    FROM "User" u
    LEFT JOIN "Branch" b ON u."branchId" = b.id
    WHERE u.role = 'STAFF'
    ORDER BY u.name ASC
  `;
  const isActive = (u: StaffRow) => u.active !== false && u.active !== null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">الموظفين</h1>
        <Link href="/admin/staff/new" className="btn-primary">
          <Plus className="w-5 h-5" />
          إضافة موظف
        </Link>
      </div>
      <div className="glass-card overflow-hidden p-0">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-right text-white/70 text-sm">
              <th className="p-4">المعرف</th>
              <th className="p-4">الاسم</th>
              <th className="p-4">الفرع</th>
              <th className="p-4">الدوام</th>
              <th className="p-4">الحالة</th>
              <th className="p-4">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((u) => (
              <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="p-4 text-white font-medium">{u.staffId}</td>
                <td className="p-4 text-white/80">{u.name}</td>
                <td className="p-4 text-white/80">{u.branch_name ?? '—'}</td>
                <td className="p-4 text-white/80">{u.workStart && u.workEnd ? `${u.workStart} - ${u.workEnd}` : '—'}</td>
                <td className="p-4">
                  <span className={isActive(u) ? 'text-emerald-400' : 'text-white/50'}>
                    {isActive(u) ? 'نشط' : 'معطّل'}
                  </span>
                </td>
                <td className="p-4 min-w-[200px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/staff/${u.id}`} className="btn-ghost text-sm shrink-0">
                      تعديل
                    </Link>
                    <StaffStatusButton staffId={u.id} active={isActive(u)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {staff.length === 0 && (
          <p className="p-8 text-center text-white/60">لا يوجد موظفين.</p>
        )}
      </div>
    </div>
  );
}
