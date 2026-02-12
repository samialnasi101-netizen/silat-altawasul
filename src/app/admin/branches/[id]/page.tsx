import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import BranchEditForm from './branch-edit-form';

export default async function BranchEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const branch = await prisma.branch.findUnique({ where: { id } });
  if (!branch) notFound();
  return (
    <div className="max-w-lg animate-fade-in">
      <h1 className="text-2xl font-bold text-white mb-6">تعديل الفرع</h1>
      <BranchEditForm branch={branch} />
    </div>
  );
}
