import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ProjectForm from '../project-form';

export default async function ProjectEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: { branchProjects: true },
  });
  if (!project) notFound();
  const branches = await prisma.branch.findMany({ orderBy: { name: 'asc' } });
  const charities = await prisma.charity.findMany({ orderBy: { name: 'asc' } });
  return (
    <div className="max-w-lg animate-fade-in">
      <h1 className="text-2xl font-bold text-white mb-6">تعديل المشروع</h1>
      <ProjectForm
        charities={charities}
        branches={branches}
        project={{
          id: project.id,
          name: project.name,
          charityId: project.charityId,
          branchProjects: project.branchProjects,
        }}
      />
    </div>
  );
}
