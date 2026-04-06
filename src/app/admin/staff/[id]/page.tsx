import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Users } from 'lucide-react';
import StaffForm from '../staff-form';

export default async function StaffEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await prisma.user.findUnique({ where: { id } });
  if (!staff || staff.role !== 'STAFF') notFound();
  const branches = await prisma.branch.findMany({ orderBy: { name: 'asc' } });
  return (
    <div className="max-w-lg animate-fade-in">
      <div className="mb-6">
        <h1 className="section-title text-xl sm:text-2xl">
          <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
          تعديل الموظف
        </h1>
        <p className="section-subtitle">{staff.name}</p>
      </div>
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
