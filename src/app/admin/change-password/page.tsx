'use client';

import { useState, useEffect } from 'react';
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

  // Auto-dismiss success after 5s
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(false), 5000);
      return () => clearTimeout(t);
    }
  }, [success]);

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
      <div className="mb-6">
        <h1 className="section-title text-xl sm:text-2xl">
          <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
          تغيير كلمة المرور
        </h1>
        <p className="section-subtitle">أدخل كلمة المرور الحالية ثم الجديدة</p>
      </div>

      {success && (
        <div className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-emerald-400 text-sm">تم تغيير كلمة المرور بنجاح.</p>
        </div>
      )}

      <form onSubmit={submit} className="glass-card space-y-4">
        <div>
          <label className="block text-sm text-white/60 mb-1.5">كلمة المرور الحالية *</label>
          <input type="password" className="input-glass" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required autoComplete="current-password" placeholder="أدخل كلمة المرور الحالية" />
        </div>
        <div>
          <label className="block text-sm text-white/60 mb-1.5">كلمة المرور الجديدة *</label>
          <input type="password" className="input-glass" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} autoComplete="new-password" placeholder="6 أحرف على الأقل" />
        </div>
        <div>
          <label className="block text-sm text-white/60 mb-1.5">تأكيد كلمة المرور الجديدة *</label>
          <input type="password" className="input-glass" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} autoComplete="new-password" placeholder="أعد إدخال كلمة المرور الجديدة" />
        </div>
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'جاري الحفظ...' : 'تغيير كلمة المرور'}
          </button>
          <Link href="/admin" className="btn-ghost">إلغاء</Link>
        </div>
      </form>
    </div>
  );
}
