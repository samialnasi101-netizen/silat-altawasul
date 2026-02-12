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
        <span className="text-white/80 text-sm">هل أنت متأكد؟ سيتم حذف {itemLabel} وجميع البيانات المرتبطة به ولا يمكن التراجع.</span>
        <button
          type="button"
          onClick={handleDelete}
          disabled={loading}
          className="text-red-400 hover:text-red-300 text-sm font-medium disabled:opacity-50"
        >
          {loading ? 'جاري...' : 'نعم، احذف'}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="text-white/70 hover:text-white text-sm"
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
      disabled={disabled}
      className="text-red-400 hover:text-red-300 disabled:opacity-50 flex items-center gap-1 text-sm"
      title={`حذف ${itemLabel}`}
    >
      <Trash2 className="w-4 h-4" />
      حذف
    </button>
  );
}
