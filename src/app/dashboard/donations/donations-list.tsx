'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Donation = {
  id: string;
  amount: { toString(): string };
  note: string | null;
  createdAt: Date;
  project: { name: string; charity: { name: string } };
};

export default function DonationsList({ donations }: { donations: Donation[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');

  const startEdit = (d: Donation) => {
    setEditingId(d.id);
    setEditAmount(Number(d.amount).toString());
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const res = await fetch(`/api/donations/${editingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: parseFloat(editAmount) }),
    });
    if (res.ok) {
      setEditingId(null);
      router.refresh();
    }
  };

  return (
    <div className="glass-card">
      <h2 className="text-lg font-semibold text-white mb-4">سجل تبرعاتي</h2>
      <ul className="space-y-2">
        {donations.map((d) => (
          <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-3 border-b border-white/10 last:border-0">
            <div>
              <span className="text-white font-medium">{d.project.name}</span>
              <span className="text-white/60 text-sm mr-2"> — {d.project.charity.name}</span>
              <span className="text-white/60 text-sm">{new Date(d.createdAt).toLocaleDateString('ar-SA')}</span>
            </div>
            {editingId === d.id ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  className="input-glass w-28"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                />
                <button type="button" onClick={saveEdit} className="btn-primary text-sm py-1.5">حفظ</button>
                <button type="button" onClick={() => setEditingId(null)} className="btn-ghost text-sm">إلغاء</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-white">{Number(d.amount).toLocaleString('ar-SA')} ر.س</span>
                <button type="button" onClick={() => startEdit(d)} className="btn-ghost text-sm">تعديل</button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {donations.length === 0 && <p className="text-white/60">لا توجد تبرعات مسجلة</p>}
    </div>
  );
}
