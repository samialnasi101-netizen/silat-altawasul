'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CharityEditForm({
  charity,
}: {
  charity: { id: string; name: string; description: string | null };
}) {
  const router = useRouter();
  const [name, setName] = useState(charity.name);
  const [description, setDescription] = useState(charity.description ?? '');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/charities/${charity.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description: description || null }),
    });
    setLoading(false);
    if (!res.ok) return;
    router.refresh();
  };

  return (
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
        <Link href="/admin/charities" className="btn-ghost">
          إلغاء
        </Link>
      </div>
    </form>
  );
}
