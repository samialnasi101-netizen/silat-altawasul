'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserX, UserCheck } from 'lucide-react';

export default function StaffStatusButton({
  staffId,
  active,
}: {
  staffId: string;
  active: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const handleDeactivate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/staff/${staffId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || 'فشل التعطيل');
        setLoading(false);
        setConfirming(false);
        return;
      }
      setConfirming(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleReactivate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/staff/${staffId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || 'فشل التفعيل');
        setLoading(false);
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  if (active) {
    if (confirming) {
      return (
        <span className="flex items-center gap-2 flex-wrap">
          <span className="text-white/80 text-sm">هل أنت متأكد؟ سيتم تعطيل الحساب ولن يتمكن الموظف من تسجيل الدخول.</span>
          <button
            type="button"
            onClick={handleDeactivate}
            disabled={loading}
            className="px-3 py-1.5 rounded bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'جاري...' : 'نعم، عطّل'}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
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
        onClick={() => setConfirming(true)}
        disabled={loading}
        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-amber-500/50 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 disabled:opacity-50 text-sm font-medium"
        title="تعطيل الحساب"
      >
        <UserX className="w-4 h-4" />
        تعطيل
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleReactivate}
      disabled={loading}
      className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-emerald-500/50 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50 text-sm font-medium"
      title="تفعيل الحساب"
    >
      <UserCheck className="w-4 h-4" />
      تفعيل
    </button>
  );
}
