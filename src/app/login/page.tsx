'use client';

import { Suspense, useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { LogIn, Shield } from 'lucide-react';

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
    const role = session?.user?.role;
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
    <div className="glass-strong rounded-3xl p-8 md:p-10 w-full max-w-md animate-scale-in">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-emerald-500/20 flex items-center justify-center">
          <Shield className="w-7 h-7 text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">تسجيل الدخول</h1>
        <p className="text-white/40 mt-1 text-sm">صلة التواصل</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white/60">رقم الموظف / المعرف</label>
          <input
            type="text"
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
            className="input-glass"
            placeholder="أدخل المعرف"
            required
            autoComplete="username"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white/60">كلمة المرور</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-glass"
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-red-300 text-sm text-center">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3.5 rounded-xl disabled:opacity-50 text-base group"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              جاري الدخول...
            </>
          ) : (
            <>
              <LogIn className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              دخول
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-emerald-950/20 via-transparent to-transparent" />
      <div className="absolute top-1/4 right-1/3 w-[500px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px]" />
      <Suspense fallback={<div className="glass-strong rounded-3xl p-8 w-full max-w-md animate-pulse h-96" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
