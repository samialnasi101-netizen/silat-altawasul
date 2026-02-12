'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewCharityPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/charities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description: description || undefined }),
    });
    setLoading(false);
    if (!res.ok) return;
    router.push('/admin/charities');
    router.refresh();
  };

  return (
    <div className="max-w-lg animate-fade-in">
      <h1 className="text-2xl font-bold text-white mb-6">إضافة جمعية</h1>
      <form onSubmit={submit} className="glass-card space-y-4">
        <div>
          <label className="block text-sm text-white/80 mb-1">الاسم *</label>
          <input className="input-glass" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm text-white/80 mb-1">الوصف</label>
          <textarea className="input-glass min-h-[100px]" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'جاري الحفظ...' : 'حفظ'}
          </button>
          <button type="button" onClick={() => router.back()} className="btn-ghost">
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
}
