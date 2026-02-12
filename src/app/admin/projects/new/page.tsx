import { prisma } from '@/lib/prisma';
import ProjectForm from '../project-form';

export default async function NewProjectPage() {
  const [charities, branches] = await Promise.all([
    prisma.charity.findMany({ orderBy: { name: 'asc' } }),
    prisma.branch.findMany({ orderBy: { name: 'asc' } }),
  ]);
  return (
    <div className="max-w-lg animate-fade-in">
      <h1 className="text-2xl font-bold text-white mb-6">إضافة مشروع</h1>
      <ProjectForm charities={charities} branches={branches} />
    </div>
  );
}
