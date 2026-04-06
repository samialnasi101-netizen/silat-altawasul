import { prisma } from '@/lib/prisma';
import { Users } from 'lucide-react';
import StaffForm from '../staff-form';

export default async function NewStaffPage() {
  const branches = await prisma.branch.findMany({ orderBy: { name: 'asc' } });
  return (
    <div className="max-w-lg animate-fade-in">
      <div className="mb-6">
        <h1 className="section-title text-xl sm:text-2xl">
          <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
          إضافة موظف
        </h1>
        <p className="section-subtitle">أضف موظفاً جديداً وعيّنه على فرع</p>
      </div>
      <StaffForm branches={branches} />
    </div>
  );
}
