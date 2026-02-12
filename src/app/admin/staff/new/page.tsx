import { prisma } from '@/lib/prisma';
import StaffForm from '../staff-form';

export default async function NewStaffPage() {
  const branches = await prisma.branch.findMany({ orderBy: { name: 'asc' } });
  return (
    <div className="max-w-lg animate-fade-in">
      <h1 className="text-2xl font-bold text-white mb-6">إضافة موظف</h1>
      <StaffForm branches={branches} />
    </div>
  );
}
