import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import CharityEditForm from './charity-edit-form';

export default async function CharityEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const charity = await prisma.charity.findUnique({ where: { id } });
  if (!charity) notFound();
  return (
    <div className="max-w-lg animate-fade-in">
      <h1 className="text-2xl font-bold text-white mb-6">تعديل الجمعية</h1>
      <CharityEditForm charity={charity} />
    </div>
  );
}
