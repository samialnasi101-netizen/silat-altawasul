import ReportsView from "./reports-view";

export default function AdminReportsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-white">التقارير والتحليل</h1>
      <ReportsView />
    </div>
  );
}
