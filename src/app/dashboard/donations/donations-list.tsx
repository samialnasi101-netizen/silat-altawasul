'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HandCoins, Clock } from 'lucide-react';

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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-white/40" />
          سجل تبرعاتي
        </h2>
        <span className="text-white/30 text-xs">{donations.length} عملية</span>
      </div>
      <div className="space-y-1">
        {donations.map((d) => (
          <div key={d.id} className="feed-item px-2 rounded-lg flex-col sm:flex-row gap-2 sm:gap-0">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <HandCoins className="w-4 h-4 text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-white/80 text-sm truncate">{d.project.name} — {d.project.charity.name}</p>
                <p className="text-white/30 text-xs">{new Date(d.createdAt).toLocaleDateString('ar-SA')}</p>
              </div>
            </div>
            {editingId === d.id ? (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input type="number" step="0.01" className="input-glass w-28" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} />
                <button type="button" onClick={saveEdit} className="btn-primary text-xs py-1.5 px-3">حفظ</button>
                <button type="button" onClick={() => setEditingId(null)} className="btn-ghost text-xs">إلغاء</button>
              </div>
            ) : (
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span className="text-white font-medium text-sm">{Number(d.amount).toLocaleString('ar-SA')} ر.س</span>
                <button type="button" onClick={() => startEdit(d)} className="btn-ghost text-xs">تعديل</button>
              </div>
            )}
          </div>
        ))}
      </div>
      {donations.length === 0 && (
        <div className="empty-state py-8">
          <HandCoins className="empty-state-icon w-10 h-10" />
          <p className="empty-state-text text-sm">لا توجد تبرعات مسجلة</p>
          <p className="empty-state-hint">سجّل أول تبرع من النموذج أعلاه</p>
        </div>
      )}
    </div>
  );
}
