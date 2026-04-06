import { FileText } from 'lucide-react';
import ReportsView from './reports-view';

export default function AdminReportsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title text-xl sm:text-2xl">
          <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
          التقارير والتحليل
        </h1>
        <p className="section-subtitle">تحميل تقارير Excel للجمعيات والفروع والحضور</p>
      </div>
      <ReportsView />
    </div>
  );
}
