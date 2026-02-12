import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import StaffForm from '../staff-form';

export default async function StaffEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await prisma.user.findUnique({
    where: { id },
  });
  if (!staff || staff.role !== 'STAFF') notFound();
  const branches = await prisma.branch.findMany({ orderBy: { name: 'asc' } });
  return (
    <div className="max-w-lg animate-fade-in">
      <h1 className="text-2xl font-bold text-white mb-6">تعديل الموظف</h1>
      <StaffForm
        branches={branches}
        staff={{
          id: staff.id,
          staffId: staff.staffId,
          name: staff.name,
          branchId: staff.branchId,
          workStart: staff.workStart,
          workEnd: staff.workEnd,
        }}
      />
    </div>
  );
}
