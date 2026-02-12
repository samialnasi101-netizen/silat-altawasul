'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Charity = { id: string; name: string };
type Branch = { id: string; name: string };

export default function ProjectForm({
  charities,
  branches,
  project,
}: {
  charities: Charity[];
  branches: Branch[];
  project?: { id: string; name: string; charityId: string; branchProjects: { branchId: string }[] };
}) {
  const router = useRouter();
  const [name, setName] = useState(project?.name ?? '');
  const [charityId, setCharityId] = useState(project?.charityId ?? charities[0]?.id ?? '');
  const [branchIds, setBranchIds] = useState<string[]>(project?.branchProjects?.map((bp) => bp.branchId) ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleBranch = (id: string) => {
    setBranchIds((prev) => (prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const url = project ? `/api/projects/${project.id}` : '/api/projects';
    const method = project ? 'PATCH' : 'POST';
    const body = project
      ? { name, branchIds }
      : { name, charityId, branchIds };
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (!res.ok) {
      setError('فشل الحفظ');
      return;
    }
    router.push('/admin/projects');
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="glass-card space-y-4">
      <div>
        <label className="block text-sm text-white/80 mb-1">اسم المشروع *</label>
        <input className="input-glass" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      {!project && (
        <div>
          <label className="block text-sm text-white/80 mb-1">الجمعية *</label>
          <select className="input-glass" value={charityId} onChange={(e) => setCharityId(e.target.value)} required>
            {charities.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="block text-sm text-white/80 mb-2">الفروع (اختر فروع المشروع)</label>
        <div className="flex flex-wrap gap-2">
          {branches.map((b) => (
            <label key={b.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={branchIds.includes(b.id)}
                onChange={() => toggleBranch(b.id)}
                className="rounded border-white/30 bg-white/5"
              />
              <span className="text-white/90">{b.name}</span>
            </label>
          ))}
        </div>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'جاري الحفظ...' : 'حفظ'}
        </button>
        <Link href="/admin/projects" className="btn-ghost">
          إلغاء
        </Link>
      </div>
    </form>
  );
}
