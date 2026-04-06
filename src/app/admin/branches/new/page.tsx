'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin } from 'lucide-react';

export default function NewBranchPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [radiusMeters, setRadiusMeters] = useState('500');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);

  const fillMyLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('المتصفح لا يدعم الموقع');
      return;
    }
    setLocationLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setLocationLoading(false);
      },
      () => {
        setError('لم يتم الحصول على الموقع. تأكد من تفعيل الموقع.');
        setLocationLoading(false);
      },
      { timeout: 10000 }
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await fetch('/api/branches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        location: location || undefined,
        lat: lat ? parseFloat(lat) : undefined,
        lng: lng ? parseFloat(lng) : undefined,
        radiusMeters: radiusMeters ? parseInt(radiusMeters, 10) : 500,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || 'فشل الحفظ');
      return;
    }
    router.push('/admin/branches');
    router.refresh();
  };

  return (
    <div className="max-w-lg animate-fade-in">
      <h1 className="text-2xl font-bold text-white mb-6">إضافة فرع</h1>
      <form onSubmit={submit} className="glass-card space-y-4">
        <div>
          <label className="block text-sm text-white/80 mb-1">اسم الفرع *</label>
          <input className="input-glass" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm text-white/80 mb-1">الموقع / العنوان</label>
          <input className="input-glass" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="grid grid-cols-2 gap-4 flex-1 min-w-[200px]">
            <div>
              <label className="block text-sm text-white/80 mb-1">خط العرض (اختياري)</label>
              <input type="number" step="any" className="input-glass" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="24.7136" />
            </div>
            <div>
              <label className="block text-sm text-white/80 mb-1">خط الطول</label>
              <input type="number" step="any" className="input-glass" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="46.6753" />
            </div>
          </div>
          <button type="button" onClick={fillMyLocation} disabled={locationLoading} className="btn-ghost flex items-center gap-2 py-2.5">
            <MapPin className="w-4 h-4" />
            {locationLoading ? 'جاري الحصول...' : 'استخدام موقعي الحالي'}
          </button>
        </div>
        <p className="text-white/50 text-xs">لتفعيل التحقق من الموقع عند الحضور، استخدم الزر أعلاه وأنت داخل الفرع ثم احفظ.</p>
        <div>
          <label className="block text-sm text-white/80 mb-1">نطاق الحضور (متر)</label>
          <input type="number" className="input-glass" value={radiusMeters} onChange={(e) => setRadiusMeters(e.target.value)} placeholder="500" />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'جاري الحفظ...' : 'حفظ'}
          </button>
          <button type="button" onClick={() => router.back()} className="btn-ghost">
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
}
