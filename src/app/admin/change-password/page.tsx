'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock } from 'lucide-react';

export default function AdminChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) {
      setError('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('كلمة المرور الجديدة وتأكيدها غير متطابقتين');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/me/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'فشل تغيير كلمة المرور');
        setLoading(false);
        return;
      }
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md animate-fade-in">
      <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
        <Lock className="w-7 h-7" />
        تغيير كلمة المرور
      </h1>
      <p className="text-white/70 text-sm mb-6">
        لتغيير كلمة مرورك يجب إدخال كلمة المرور الحالية ثم الكلمة الجديدة.
      </p>
      {success && (
        <div className="mb-4 p-4 rounded-xl bg-emerald-500/20 text-emerald-300 text-sm">
          تم تغيير كلمة المرور بنجاح.
        </div>
      )}
      <form onSubmit={submit} className="glass-card space-y-4">
        <div>
          <label className="block text-sm text-white/80 mb-1">كلمة المرور الحالية *</label>
          <input
            type="password"
            className="input-glass w-full"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="أدخل كلمة المرور الحالية"
          />
        </div>
        <div>
          <label className="block text-sm text-white/80 mb-1">كلمة المرور الجديدة *</label>
          <input
            type="password"
            className="input-glass w-full"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="6 أحرف على الأقل"
          />
        </div>
        <div>
          <label className="block text-sm text-white/80 mb-1">تأكيد كلمة المرور الجديدة *</label>
          <input
            type="password"
            className="input-glass w-full"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="أعد إدخال كلمة المرور الجديدة"
          />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'جاري الحفظ...' : 'تغيير كلمة المرور'}
          </button>
          <Link href="/admin" className="btn-ghost">
            إلغاء
          </Link>
        </div>
      </form>
    </div>
  );
}
