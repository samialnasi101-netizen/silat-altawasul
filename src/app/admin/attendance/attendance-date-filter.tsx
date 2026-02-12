'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function todayLocalYYYYMMDD() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function AttendanceDateFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');
  const current = dateParam ?? todayLocalYYYYMMDD();

  useEffect(() => {
    if (!dateParam) router.replace(`/admin/attendance?date=${todayLocalYYYYMMDD()}`);
  }, [dateParam, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    if (date) router.push(`/admin/attendance?date=${date}`);
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <label className="text-white/80 text-sm">اختر التاريخ:</label>
      <input
        type="date"
        value={current}
        onChange={handleChange}
        className="input-glass w-44"
      />
    </div>
  );
}
