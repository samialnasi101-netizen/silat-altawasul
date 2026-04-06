'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Branch = { id: string; name: string };
type Staff = { id: string; staffId: string; name: string; branchId: string | null; workStart: string | null; workEnd: string | null };

export default function StaffForm({
  branches,
  staff,
}: {
  branches: Branch[];
  staff?: Staff;
}) {
  const router = useRouter();
  const [staffId, setStaffId] = useState(staff?.staffId ?? '');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(staff?.name ?? '');
  const [branchId, setBranchId] = useState(staff?.branchId ?? branches[0]?.id ?? '');
  const [workStart, setWorkStart] = useState(staff?.workStart ?? '09:00');
  const [workEnd, setWorkEnd] = useState(staff?.workEnd ?? '17:00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!staff && !password) {
      setError('كلمة المرور مطلوبة للموظف الجديد');
      return;
    }
    setLoading(true);
    const url = staff ? `/api/staff/${staff.id}` : '/api/staff';
    const method = staff ? 'PATCH' : 'POST';
    const body = staff
      ? { name, branchId: branchId || null, workStart, workEnd, ...(password && { password }) }
      : { staffId, password, name, branchId: branchId || null, workStart, workEnd };
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || 'فشل الحفظ');
      return;
    }
    router.push('/admin/staff');
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="glass-card space-y-4">
      <div>
        <label className="block text-sm text-white/80 mb-1">معرف الدخول (رقم الموظف) *</label>
        <input
          className="input-glass"
          value={staffId}
          onChange={(e) => setStaffId(e.target.value)}
          required
          disabled={!!staff}
        />
      </div>
      {!staff && (
        <div>
          <label className="block text-sm text-white/80 mb-1">كلمة المرور *</label>
          <input type="password" className="input-glass" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} />
        </div>
      )}
      {staff && (
        <div>
          <label className="block text-sm text-white/80 mb-1">كلمة مرور جديدة للموظف (اختياري — اتركها فارغة للإبقاء على الحالية)</label>
          <input type="password" className="input-glass" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} placeholder="لا تحتاج إدخال كلمة المرور القديمة" />
        </div>
      )}
      <div>
        <label className="block text-sm text-white/80 mb-1">الاسم *</label>
        <input className="input-glass" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <label className="block text-sm text-white/80 mb-1">الفرع</label>
        <select className="input-glass" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
          <option value="">— لا فرع —</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-white/80 mb-1">بداية الدوام</label>
          <input type="time" className="input-glass" value={workStart} onChange={(e) => setWorkStart(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-white/80 mb-1">نهاية الدوام</label>
          <input type="time" className="input-glass" value={workEnd} onChange={(e) => setWorkEnd(e.target.value)} />
        </div>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'جاري الحفظ...' : 'حفظ'}
        </button>
        <Link href="/admin/staff" className="btn-ghost">
          إلغاء
        </Link>
      </div>
    </form>
  );
}
