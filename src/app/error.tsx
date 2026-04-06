'use client';

import { AlertTriangle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="glass-card max-w-md text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">حدث خطأ غير متوقع</h2>
        <p className="text-white/60 text-sm">
          {process.env.NODE_ENV === 'development' ? error.message : 'حدث خطأ أثناء تحميل الصفحة. يرجى المحاولة مرة أخرى.'}
        </p>
        <button onClick={reset} className="btn-primary">
          إعادة المحاولة
        </button>
      </div>
    </div>
  );
}
