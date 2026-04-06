'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2 } from 'lucide-react';

export default function NewCharityPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await fetch('/api/charities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description: description || undefined }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || 'فشل الحفظ');
      return;
    }
    router.push('/admin/charities');
    router.refresh();
  };

  return (
    <div className="max-w-lg animate-fade-in">
      <div className="mb-6">
        <h1 className="section-title text-xl sm:text-2xl">
          <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
          إضافة جمعية
        </h1>
        <p className="section-subtitle">أضف جمعية خيرية جديدة للنظام</p>
      </div>
      <form onSubmit={submit} className="glass-card space-y-4">
        <div>
          <label className="block text-sm text-white/60 mb-1.5">الاسم *</label>
          <input className="input-glass" value={name} onChange={(e) => setName(e.target.value)} required placeholder="اسم الجمعية" />
        </div>
        <div>
          <label className="block text-sm text-white/60 mb-1.5">الوصف</label>
          <textarea className="input-glass min-h-[100px]" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="وصف مختصر (اختياري)" />
        </div>
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'جاري الحفظ...' : 'حفظ'}
          </button>
          <button type="button" onClick={() => router.back()} className="btn-ghost">إلغاء</button>
        </div>
      </form>
    </div>
  );
}
