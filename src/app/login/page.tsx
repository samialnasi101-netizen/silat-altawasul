'use client';

import { Suspense, useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

function LoginForm() {
  const searchParams = useSearchParams();
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await signIn('credentials', {
      staffId,
      password,
      redirect: false,
    });
    if (res?.error) {
      setLoading(false);
      setError('رقم الموظف أو كلمة المرور غير صحيحة');
      return;
    }
    const session = await getSession();
    const role = (session?.user as { role?: string })?.role;
    const callback = searchParams.get('callbackUrl');
    let redirectTo = '/dashboard';
    if (callback && (callback.startsWith('/admin') || callback.startsWith('/dashboard'))) {
      redirectTo = callback;
    } else if (role === 'ADMIN') {
      redirectTo = '/admin';
    } else if (role === 'STAFF') {
      redirectTo = '/dashboard';
    }
    setLoading(false);
    window.location.href = redirectTo;
  };

  return (
    <div className="glass-strong rounded-3xl p-8 md:p-10 w-full max-w-md animate-slide-up">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white">تسجيل الدخول</h1>
        <p className="text-white/60 mt-1">صلة التواصل</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">رقم الموظف / المعرف</label>
          <input type="text" value={staffId} onChange={(e) => setStaffId(e.target.value)} className="input-glass" placeholder="أدخل المعرف" required autoComplete="username" />
        </div>
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">كلمة المرور</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-glass" placeholder="••••••••" required autoComplete="current-password" />
        </div>
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full py-3 rounded-xl disabled:opacity-50">
          {loading ? 'جاري الدخول...' : 'دخول'}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-emerald-950/30 via-transparent to-transparent" />
      <Suspense fallback={<div className="glass-strong rounded-3xl p-8 w-full max-w-md animate-pulse h-80" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
