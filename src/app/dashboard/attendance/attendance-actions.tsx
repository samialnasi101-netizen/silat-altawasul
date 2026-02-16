'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, LogOut } from 'lucide-react';
import {
  getSaudiTimeParts,
  timeStringToMinutes,
  formatTimeSaudi,
} from '@/lib/saudi-time';

export default function AttendanceActions({
  hasOpenAttendance,
  branchNeedsLocation,
  workStart,
  workEnd,
}: {
  hasOpenAttendance: boolean;
  branchNeedsLocation: boolean;
  workStart: string;
  workEnd: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lateReason, setLateReason] = useState('');
  const [currentTime, setCurrentTime] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const saudiNow = getSaudiTimeParts(currentTime);
  const currentMinutes = saudiNow.hours * 60 + saudiNow.minutes;
  const workStartM = timeStringToMinutes(workStart);
  const workEndM = timeStringToMinutes(workEnd);
  const earliestCheckInM = workStartM - 10;
  const latestCheckOutM = workEndM + 15;

  const canCheckIn = currentMinutes >= earliestCheckInM && currentMinutes <= workEndM;
  const canCheckOut = currentMinutes >= workEndM && currentMinutes <= latestCheckOutM;
  const now = currentTime;

  const getLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        reject,
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });
  };

  const checkIn = async () => {
    setError('');
    if (!canCheckIn) return;
    setLoading(true);
    let lat: number | null = null;
    let lng: number | null = null;
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        const coords = await getLocation();
        lat = coords.lat;
        lng = coords.lng;
      } catch {
        if (branchNeedsLocation) {
          try {
            const coords = await getLocation();
            lat = coords.lat;
            lng = coords.lng;
          } catch {
            setLoading(false);
            setError('لم يتم الحصول على الموقع. تأكد من: 1) السماح للموقع للمتصفح 2) أنك داخل الفرع 3) جرب مرة أخرى.');
            return;
          }
        }
      }
    } else if (branchNeedsLocation) {
      setLoading(false);
      setError('المتصفح لا يدعم الموقع. استخدم متصفحاً يدعم الموقع وتأكد أنك داخل الفرع.');
      return;
    }

    const isLate = currentMinutes > workStartM + 15;
    const body: { lat: number | null; lng: number | null; lateReason?: string } = { lat, lng };
    if (isLate && lateReason.trim().length >= 3) body.lateReason = lateReason.trim();

    const res = await fetch('/api/attendance/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      const msg = data.detail ? `${data.error}: ${data.detail}` : (data.error || 'فشل تسجيل الحضور');
      setError(msg);
      return;
    }
    setLateReason('');
    router.refresh();
  };

  const checkOut = async () => {
    setError('');
    if (!canCheckOut) return;

    setLoading(true);
    let lat: number | null = null;
    let lng: number | null = null;
    if (branchNeedsLocation && typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        const coords = await getLocation();
        lat = coords.lat;
        lng = coords.lng;
      } catch {
        setLoading(false);
        setError('لم يتم الحصول على الموقع. يجب أن تكون داخل الفرع لتسجيل الانصراف.');
        return;
      }
    } else if (branchNeedsLocation) {
      setLoading(false);
      setError('المتصفح لا يدعم الموقع. يجب أن تكون في موقع الفرع لتسجيل الانصراف.');
      return;
    }

    const body: { lat?: number; lng?: number } = {};
    if (lat != null && lng != null) {
      body.lat = lat;
      body.lng = lng;
    }
    const res = await fetch('/api/attendance/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error || 'فشل تسجيل الانصراف');
      return;
    }
    router.refresh();
  };

  return (
    <div className="glass-card space-y-4">
      <p className="text-white/70 text-sm">التوقيت: السعودية {formatTimeSaudi(currentTime)}</p>
      {!hasOpenAttendance ? (
        <>
          {!canCheckIn && currentMinutes < earliestCheckInM && (
            <p className="text-amber-200/90 text-sm">يمكن تسجيل الحضور قبل 10 دقائق فقط من بداية الدوام ({workStart}).</p>
          )}
          {!canCheckIn && currentMinutes > workEndM && (
            <p className="text-amber-200/90 text-sm">انتهى وقت الدوام. لا يمكن تسجيل الحضور بعد نهاية الدوام ({workEnd}).</p>
          )}
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            <button
              onClick={checkIn}
              disabled={loading || !canCheckIn}
              className="btn-primary flex-1 flex items-center justify-center gap-2 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogIn className="w-5 h-5" />
              {loading ? 'جاري التسجيل...' : 'تسجيل الحضور'}
            </button>
          </div>
          {branchNeedsLocation && (
            <p className="text-amber-200/90 text-sm">الحضور من داخل الفرع فقط: سيتم التحقق من موقعك. اسمح للمتصفح بالوصول للموقع وكن داخل نطاق الفرع.</p>
          )}
          <div>
            <label className="block text-sm text-white/80 mb-1">سبب التأخر (إذا تأخرت أكثر من 15 دقيقة)</label>
            <input
              className="input-glass w-full"
              value={lateReason}
              onChange={(e) => setLateReason(e.target.value)}
              placeholder="اختياري إلا في حال التأخر"
            />
          </div>
        </>
      ) : (
        <>
          {!canCheckOut && currentMinutes < workEndM && (
            <p className="text-amber-200/90 text-sm">يمكن تسجيل الانصراف من نهاية الدوام ({workEnd}) حتى 15 دقيقة بعدها. يجب أن تكون في موقع الفرع.</p>
          )}
          {!canCheckOut && currentMinutes > latestCheckOutM && (
            <p className="text-amber-200/90 text-sm">انتهى وقت تسجيل الانصراف يدوياً. سيتم إغلاق الحضور تلقائياً (الموظف لم يسجل خروج من الفرع). حدّث الصفحة.</p>
          )}
          {branchNeedsLocation && canCheckOut && (
            <p className="text-amber-200/90 text-sm">الانصراف من داخل الفرع فقط: سيتم التحقق من موقعك.</p>
          )}
          <button
            onClick={checkOut}
            disabled={loading || !canCheckOut}
            className="btn-primary flex items-center justify-center gap-2 py-4 bg-amber-600 hover:bg-amber-500 w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut className="w-5 h-5" />
            {loading ? 'جاري التسجيل...' : 'تسجيل الانصراف'}
          </button>
        </>
      )}
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  );
}
