import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import DonationCreateForm from './donation-create-form';
import DonationsList from './donations-list';

export default async function StaffDonationsPage() {
  const session = await getSession();
  const userId = (session?.user as { id?: string })?.id;
  const branchId = (session?.user as { branchId?: string })?.branchId;
  if (!userId) return null;

  const [donations, branchProjects] = await Promise.all([
    prisma.donation.findMany({
      where: { userId },
      include: { project: { include: { charity: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
    }),
    branchId
      ? prisma.branchProject.findMany({
          where: { branchId },
          include: { project: { include: { charity: { select: { name: true } } } } },
        })
      : [],
  ]);

  const projects = branchProjects.map((bp) => bp.project);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-white">التبرعات</h1>
      {branchId ? (
        <>
          <DonationCreateForm projects={projects} />
          <DonationsList donations={donations} />
        </>
      ) : (
        <div className="glass-card">
          <p className="text-white/80">لم يتم تعيين فرع لك. لا يمكن تسجيل تبرعات.</p>
        </div>
      )}
    </div>
  );
}
