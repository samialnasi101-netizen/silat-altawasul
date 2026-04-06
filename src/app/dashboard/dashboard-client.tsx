'use client';

import { AnimatedCounter } from '@/components/animated-counter';
import { ProgressRing } from '@/components/charts';

export function StatValue({ value, suffix = '' }: { value: number; suffix?: string }) {
  return <AnimatedCounter value={value} suffix={suffix} className="text-2xl font-bold text-white" />;
}

export function AttendanceRing({
  daysPresent,
  daysInMonth,
}: {
  daysPresent: number;
  daysInMonth: number;
}) {
  return (
    <ProgressRing
      value={daysPresent}
      max={daysInMonth}
      size={90}
      strokeWidth={7}
      color="#34d399"
      label="حضور"
    />
  );
}
