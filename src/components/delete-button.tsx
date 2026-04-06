'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

export default function DeleteButton({
  endpoint,
  itemLabel,
  disabled,
}: {
  endpoint: string;
  itemLabel: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(endpoint, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || 'فشل الحذف');
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

  if (confirming) {
    return (
      <span className="flex items-center gap-2 flex-wrap">
        <span className="text-white/60 text-xs">حذف {itemLabel}؟</span>
        <button
          type="button"
          onClick={handleDelete}
          disabled={loading}
          className="px-3 py-1 rounded-lg text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25 transition disabled:opacity-50"
        >
          {loading ? 'جاري...' : 'نعم'}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="btn-ghost text-xs py-1"
        >
          لا
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      disabled={disabled}
      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/15 hover:bg-red-500/20 transition disabled:opacity-50 flex items-center gap-1.5"
      title={`حذف ${itemLabel}`}
    >
      <Trash2 className="w-3.5 h-3.5" />
      حذف
    </button>
  );
}
