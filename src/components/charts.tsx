'use client';

import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';

const COLORS = ['#34d399', '#60a5fa', '#fbbf24', '#a78bfa', '#f472b6', '#22d3ee', '#fb923c', '#4ade80'];

const tooltipStyle = {
  contentStyle: {
    background: 'var(--tooltip-bg)',
    border: '1px solid var(--tooltip-border)',
    borderRadius: '12px',
    color: 'var(--tooltip-text)',
    fontSize: '13px',
    padding: '10px 14px',
    direction: 'rtl' as const,
  },
  itemStyle: { color: '#94a3b8' },
};

// ── Donut Chart (donations by branch) ──
export function DonationsDonut({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
            animationBegin={200}
            animationDuration={1000}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} opacity={0.85} />
            ))}
          </Pie>
          <Tooltip
            formatter={(val) => `${Number(val).toLocaleString('ar-SA')} ر.س`}
            {...tooltipStyle}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Center label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <p className="text-xl font-bold text-white">{total.toLocaleString('ar-SA')}</p>
          <p className="text-white/40 text-[10px]">ر.س</p>
        </div>
      </div>
    </div>
  );
}

// ── Bar Chart (branch comparison) ──
export function BranchBarChart({
  data,
}: {
  data: { name: string; amount: number; active: number }[];
}) {
  if (data.length === 0) return null;

  // Sort by amount descending so the biggest branches show first
  const sorted = [...data].sort((a, b) => b.amount - a.amount);

  // Top 10 branches + "أخرى" for the rest
  const maxBars = 10;
  let chartData: { name: string; amount: number }[];
  if (sorted.length > maxBars) {
    const top = sorted.slice(0, maxBars);
    const rest = sorted.slice(maxBars);
    const otherTotal = rest.reduce((s, d) => s + d.amount, 0);
    chartData = [...top, { name: `أخرى (${rest.length})`, amount: otherTotal }];
  } else {
    chartData = sorted;
  }

  // Truncate long names
  const truncated = chartData.map((d) => ({
    ...d,
    shortName: d.name.length > 20 ? d.name.slice(0, 18) + '…' : d.name,
    fullName: d.name,
  }));

  const maxAmount = Math.max(...truncated.map((d) => d.amount), 1);

  return (
    <div className="space-y-2">
      {truncated.map((d, i) => {
        const pct = (d.amount / maxAmount) * 100;
        const colors = [
          'from-emerald-400 to-emerald-500',
          'from-blue-400 to-blue-500',
          'from-amber-400 to-amber-500',
          'from-purple-400 to-purple-500',
          'from-cyan-400 to-cyan-500',
          'from-rose-400 to-rose-500',
          'from-orange-400 to-orange-500',
          'from-teal-400 to-teal-500',
          'from-indigo-400 to-indigo-500',
          'from-lime-400 to-lime-500',
          'from-slate-400 to-slate-500',
        ];
        return (
          <div key={i} className="group" title={d.fullName}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-white/70 text-xs truncate max-w-[180px]">{d.shortName}</span>
              <span className="text-white/90 text-xs font-medium tabular-nums">{d.amount.toLocaleString('ar-SA')} ر.س</span>
            </div>
            <div className="h-5 rounded-md overflow-hidden" style={{ background: 'var(--progress-track)' }}>
              <div
                className={`h-full bg-gradient-to-l ${colors[i % colors.length]} rounded-md transition-all duration-1000 ease-out`}
                style={{ width: `${Math.max(pct, 1.5)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Area Chart (weekly/daily trend) ──
export function DonationsTrendChart({
  data,
}: {
  data: { label: string; amount: number }[];
}) {
  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis hide />
        <Tooltip
          formatter={(val) => [`${Number(val).toLocaleString('ar-SA')} ر.س`, 'التبرعات']}
          {...tooltipStyle}
        />
        <Area
          type="monotone"
          dataKey="amount"
          stroke="#34d399"
          strokeWidth={2}
          fill="url(#areaGrad)"
          animationDuration={1500}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Mini Sparkline (for stat cards) ──
export function Sparkline({
  data,
  color = '#34d399',
  height = 40,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  if (data.length < 2) return null;
  const chartData = data.map((v, i) => ({ i, v }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
        <defs>
          <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#spark-${color.replace('#', '')})`}
          animationDuration={800}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Progress Ring (circular progress) ──
export function ProgressRing({
  value,
  max,
  size = 80,
  strokeWidth = 6,
  color = '#34d399',
  label,
}: {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const offset = circumference - pct * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="progress-ring">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--progress-track)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-white text-sm font-bold">{Math.round(pct * 100)}%</span>
        {label && <span className="text-white/40 text-[9px]">{label}</span>}
      </div>
    </div>
  );
}

// ── Legend for charts ──
export function ChartLegend({ items }: { items: { name: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap gap-3 mt-3">
      {items.map((item) => (
        <div key={item.name} className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
          <span className="text-white/50 text-xs">{item.name}</span>
        </div>
      ))}
    </div>
  );
}
