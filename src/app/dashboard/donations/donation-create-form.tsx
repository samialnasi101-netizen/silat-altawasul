'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
      <div className="glass-card">
        <p className="text-white/80">لا توجد مشاريع معينة لفرعك. تواصل مع المدير.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="glass-card flex flex-wrap items-end gap-4">
      <div className="min-w-[200px]">
        <label className="block text-sm text-white/80 mb-1">المشروع *</label>
        <select className="input-glass" value={projectId} onChange={(e) => setProjectId(e.target.value)} required>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name} ({p.charity.name})</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm text-white/80 mb-1">المبلغ (ر.س) *</label>
        <input type="number" step="0.01" min="0.01" className="input-glass w-32" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      </div>
      <div className="min-w-[200px] flex-1">
        <label className="block text-sm text-white/80 mb-1">ملاحظة</label>
        <input className="input-glass" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? 'جاري الحفظ...' : 'تسجيل التبرع'}
      </button>
      {error && <p className="text-red-400 text-sm w-full">{error}</p>}
    </form>
  );
}
