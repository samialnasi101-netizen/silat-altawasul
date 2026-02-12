import { prisma } from '@/lib/prisma';
import HistoricalList from './historical-list';

export default async function AdminHistoricalPage() {
  const reports = await prisma.historicalReport.findMany({
    orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
  });
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-white">التقارير التاريخية</h1>
      <HistoricalList initialReports={reports} />
    </div>
  );
}
