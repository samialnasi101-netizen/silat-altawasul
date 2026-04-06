import { prisma } from '@/lib/prisma';
import { History } from 'lucide-react';
import HistoricalList from './historical-list';

export default async function AdminHistoricalPage() {
  const reports = await prisma.historicalReport.findMany({
    orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
  });
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title text-xl sm:text-2xl">
          <History className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
          التقارير التاريخية
        </h1>
        <p className="section-subtitle">رفع ومراجعة تقارير السنوات السابقة</p>
      </div>
      <HistoricalList initialReports={reports} />
    </div>
  );
}
