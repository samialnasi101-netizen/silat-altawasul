'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HandCoins, FolderKanban } from 'lucide-react';

type Project = { id: string; name: string; charity: { name: string } };

export default function DonationCreateForm({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setError('المبلغ غير صالح');
      return;
    }
    setLoading(true);
    const res = await fetch('/api/donations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, amount: amt, note: note || undefined }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || 'فشل الحفظ');
      return;
    }
    setAmount('');
    setNote('');
    router.refresh();
  };

  if (projects.length === 0) {
    return (
      <div className="glass-card text-center py-8">
        <FolderKanban className="w-10 h-10 mx-auto mb-3 text-white/20" />
        <p className="text-white/60">لا توجد مشاريع معينة لفرعك</p>
        <p className="text-white/30 text-sm mt-1">تواصل مع المدير لتعيين مشاريع</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="glass-card space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <label className="block text-sm text-white/60 mb-1.5">المشروع *</label>
          <select className="input-glass" value={projectId} onChange={(e) => setProjectId(e.target.value)} required>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.charity.name})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-white/60 mb-1.5">المبلغ (ر.س) *</label>
          <input type="number" step="0.01" min="0.01" className="input-glass" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="0.00" />
        </div>
        <div>
          <label className="block text-sm text-white/60 mb-1.5">ملاحظة</label>
          <input className="input-glass" value={note} onChange={(e) => setNote(e.target.value)} placeholder="اختياري" />
        </div>
        <div className="flex items-end">
          <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto">
            <HandCoins className="w-4 h-4" />
            {loading ? 'جاري الحفظ...' : 'تسجيل التبرع'}
          </button>
        </div>
      </div>
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
    </form>
  );
}
