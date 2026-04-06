'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

const HAS_DONATIONS_MESSAGE =
  'هذا الموظف الذي تريد حذفه قد سجل تبرعات، وحذفك له قد يؤثر على سجلات التبرعات، الأفضل أن تعطل نشاط الموظف على أن تحذفه.';

export default function StaffDeleteButton({
  staffId,
  staffName,
}: {
  staffId: string;
  staffName: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'idle' | 'confirm' | 'has-donations'>('idle');

  const performDelete = async (confirmWithDonations: boolean) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/staff/${staffId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(confirmWithDonations ? { confirmDeleteWithDonations: true } : {}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.hasDonations) {
          setStep('has-donations');
        } else {
          alert(data.error || 'فشل الحذف');
          setStep('idle');
        }
        setLoading(false);
        return;
      }
      setStep('idle');
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  if (step === 'has-donations') {
    return (
      <span className="flex flex-col gap-2 max-w-sm">
        <p className="text-amber-200/90 text-sm">{HAS_DONATIONS_MESSAGE}</p>
        <span className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => performDelete(true)}
            disabled={loading}
            className="px-3 py-1.5 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'جاري الحذف...' : 'نعم، احذفه رغم ذلك'}
          </button>
          <button
            type="button"
            onClick={() => setStep('idle')}
            disabled={loading}
            className="px-3 py-1.5 rounded bg-white/10 text-white/80 hover:bg-white/20 text-sm"
          >
            إلغاء
          </button>
        </span>
      </span>
    );
  }

  if (step === 'confirm') {
    return (
      <span className="flex items-center gap-2 flex-wrap">
        <span className="text-white/80 text-sm">حذف {staffName} نهائياً؟</span>
        <button
          type="button"
          onClick={() => performDelete(false)}
          disabled={loading}
          className="px-3 py-1.5 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 text-sm font-medium disabled:opacity-50"
        >
          {loading ? 'جاري...' : 'نعم، احذف'}
        </button>
        <button
          type="button"
          onClick={() => setStep('idle')}
          disabled={loading}
          className="px-3 py-1.5 rounded bg-white/10 text-white/80 hover:bg-white/20 text-sm"
        >
          إلغاء
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setStep('confirm')}
      disabled={loading}
      className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-red-500/50 bg-red-500/10 text-red-300 hover:bg-red-500/20 disabled:opacity-50 text-sm font-medium"
      title="حذف الموظف"
    >
      <Trash2 className="w-4 h-4" />
      حذف
    </button>
  );
}
