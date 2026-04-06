'use client';

import { HandCoins, TrendingUp, Clock } from 'lucide-react';
import { AnimatedCounter } from '@/components/animated-counter';
import { DonationsDonut, DonationsTrendChart, BranchBarChart, ChartLegend } from '@/components/charts';

const COLORS = ['#34d399', '#60a5fa', '#fbbf24', '#a78bfa', '#f472b6', '#22d3ee', '#fb923c', '#4ade80'];

export default function AdminDashboardCharts({
  totalAll,
  monthTotal,
  todayTotal,
  todayCount,
  weeklyTrend,
  donutData,
  barData,
}: {
  totalAll: number;
  monthTotal: number;
  todayTotal: number;
  todayCount: number;
  weeklyTrend: { label: string; amount: number }[];
  donutData: { name: string; value: number }[];
  barData: { name: string; amount: number; active: number }[];
}) {
  return (
    <>
      {/* Money stats with animated counters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card stat-card-amber animate-slide-up stagger-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="icon-box bg-amber-500/15">
              <HandCoins className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-white/40 text-sm">إجمالي التبرعات</p>
          </div>
          <p className="text-2xl font-bold text-white">
            <AnimatedCounter value={totalAll} duration={1500} />
            <span className="text-base font-normal text-white/40 mr-1">ر.س</span>
          </p>
        </div>

        <div className="stat-card stat-card-emerald animate-slide-up stagger-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="icon-box bg-emerald-500/15">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-white/40 text-sm">تبرعات الشهر</p>
          </div>
          <p className="text-2xl font-bold text-white">
            <AnimatedCounter value={monthTotal} duration={1200} />
            <span className="text-base font-normal text-white/40 mr-1">ر.س</span>
          </p>
        </div>

        <div className="stat-card stat-card-blue animate-slide-up stagger-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="icon-box bg-blue-500/15">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-white/40 text-sm">تبرعات اليوم</p>
          </div>
          <p className="text-2xl font-bold text-white">
            <AnimatedCounter value={todayTotal} duration={1000} />
            <span className="text-base font-normal text-white/40 mr-1">ر.س</span>
          </p>
          <p className="text-white/30 text-xs mt-1">{todayCount} عملية</p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly trend */}
        <div className="glass-card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              اتجاه التبرعات — آخر 7 أيام
            </h2>
          </div>
          {weeklyTrend.some((d) => d.amount > 0) ? (
            <DonationsTrendChart data={weeklyTrend} />
          ) : (
            <div className="flex items-center justify-center h-[200px] text-white/20 text-sm">
              لا توجد بيانات كافية لعرض الرسم البياني
            </div>
          )}
        </div>

        {/* Donut chart */}
        <div className="glass-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">توزيع التبرعات</h2>
          </div>
          {donutData.length > 0 ? (
            <>
              <DonationsDonut data={donutData} />
              <ChartLegend
                items={donutData.map((d, i) => ({
                  name: d.name,
                  color: COLORS[i % COLORS.length],
                }))}
              />
            </>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-white/20 text-sm">
              لا توجد تبرعات بعد
            </div>
          )}
        </div>
      </div>

      {/* Branch bar chart — only if there are multiple branches */}
      {barData.length > 1 && (
        <div className="glass-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <HandCoins className="w-4 h-4 text-amber-400" />
              مقارنة الفروع
            </h2>
            <span className="text-white/30 text-xs">إجمالي التبرعات لكل فرع</span>
          </div>
          <BranchBarChart data={barData} />
        </div>
      )}
    </>
  );
}
