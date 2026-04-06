'use client';

import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card max-w-lg mx-auto text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">خطأ في لوحة التحكم</h2>
        <p className="text-white/60 text-sm">
          {process.env.NODE_ENV === 'development' ? error.message : 'حدث خطأ أثناء تحميل هذه الصفحة.'}
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="btn-primary">
            إعادة المحاولة
          </button>
          <Link href="/admin" className="btn-ghost">
            الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
