'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function AdminResetSystemPage() {
  const router = useRouter();
  const [step, setStep] = useState<0 | 1>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/reset-system', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'فشل إعادة التعيين');
        setLoading(false);
        return;
      }
      setStep(0);
      router.refresh();
      router.push('/admin');
    } catch {
      setError('فشل إعادة التعيين');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg animate-fade-in">
      <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
        <RotateCcw className="w-7 h-7" />
        إعادة تعيين النظام
      </h1>
      <p className="text-white/70 text-sm mb-6">
        حذف جميع البيانات من النظام (موظفين، فروع، جمعيات، مشاريع، تبرعات، حضور، تقارير تاريخية). يبقى حساب المدير فقط.
      </p>

      <div className="glass-card border border-red-500/30 space-y-4">
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-200 font-medium">
            تحذير: هذا الإجراء سيفقدك جميع البيانات ولا يمكن التراجع عنه.
          </p>
        </div>

        {step === 0 && (
          <>
            <p className="text-white/90">
              هل أنت متأكد من رغبتك في إعادة تعيين النظام؟ سيتم حذف كل البيانات المذكورة أعلاه.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn-primary bg-red-600 hover:bg-red-500 focus:ring-red-500/30"
              >
                نعم، متأكد — المتابعة
              </button>
              <Link href="/admin" className="btn-ghost">
                إلغاء
              </Link>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <p className="text-white/90 font-medium">
              تأكيد نهائي: سيتم الآن حذف جميع البيانات (تبرعات، حضور، موظفين، فروع، مشاريع، جمعيات، تقارير تاريخية). لا يمكن التراجع.
            </p>
            <p className="text-white/70 text-sm">
              انقر &quot;نعم، إعادة التعيين&quot; لتنفيذ الحذف.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleReset}
                disabled={loading}
                className="btn-primary bg-red-600 hover:bg-red-500 focus:ring-red-500/30 disabled:opacity-50"
              >
                {loading ? 'جاري التنفيذ...' : 'نعم، إعادة التعيين'}
              </button>
              <button
                type="button"
                onClick={() => setStep(0)}
                disabled={loading}
                className="btn-ghost"
              >
                رجوع
              </button>
            </div>
          </>
        )}

        {error && <p className="text-red-400 text-sm">{error}</p>}
      </div>
    </div>
  );
}
