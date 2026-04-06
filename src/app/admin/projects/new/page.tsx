import { prisma } from '@/lib/prisma';
import { FolderKanban } from 'lucide-react';
import ProjectForm from '../project-form';

export default async function NewProjectPage() {
  const [charities, branches] = await Promise.all([
    prisma.charity.findMany({ orderBy: { name: 'asc' } }),
    prisma.branch.findMany({ orderBy: { name: 'asc' } }),
  ]);
  return (
    <div className="max-w-lg animate-fade-in">
      <div className="mb-6">
        <h1 className="section-title text-xl sm:text-2xl">
          <FolderKanban className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
          إضافة مشروع
        </h1>
        <p className="section-subtitle">أضف مشروعاً جديداً وربطه بالجمعية والفروع</p>
      </div>
      <ProjectForm charities={charities} branches={branches} />
    </div>
  );
}
