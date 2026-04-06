import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { HandCoins } from 'lucide-react';
import DonationCreateForm from './donation-create-form';
import DonationsList from './donations-list';

export default async function StaffDonationsPage() {
  const session = await getSession();
  const userId = session?.user?.id;
  const branchId = session?.user?.branchId;
  if (!userId) return null;

  const [donations, branchProjects] = await Promise.all([
    prisma.donation.findMany({
      where: { userId },
      include: { project: { include: { charity: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    branchId
      ? prisma.branchProject.findMany({
          where: { branchId },
          include: { project: { include: { charity: { select: { name: true } } } } },
        })
      : [],
  ]);

  const projects = branchProjects.map((bp) => bp.project);
  const totalAmount = donations.reduce((s, d) => s + Number(d.amount), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="section-header">
        <div>
          <h1 className="section-title">
            <HandCoins className="w-6 h-6 text-amber-400" />
            التبرعات
          </h1>
          <p className="section-subtitle">سجّل تبرعات جديدة وتابع سجلك</p>
        </div>
        {donations.length > 0 && (
          <div className="text-left">
            <p className="text-white/40 text-xs">الإجمالي</p>
            <p className="text-lg font-bold text-white">{totalAmount.toLocaleString('ar-SA')} <span className="text-sm text-white/40">ر.س</span></p>
          </div>
        )}
      </div>

      {branchId ? (
        <>
          <DonationCreateForm projects={projects} />
          <DonationsList donations={donations} />
        </>
      ) : (
        <div className="glass-card text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/10 flex items-center justify-center">
            <HandCoins className="w-8 h-8 text-amber-400" />
          </div>
          <p className="text-white/80 text-lg mb-1">لم يتم تعيين فرع لك</p>
          <p className="text-white/40 text-sm">لا يمكن تسجيل تبرعات بدون فرع</p>
        </div>
      )}
    </div>
  );
}
