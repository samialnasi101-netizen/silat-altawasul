/**
 * GPS spoofing anomaly detection for attendance records.
 *
 * Detects:
 * 1. Suspiciously perfect accuracy (< 3m on mobile = likely mocked)
 * 2. Exact branch center coordinates (copy-pasted the branch lat/lng)
 * 3. Repeated identical coordinates across days (no natural GPS drift)
 */

type AnomalyResult = {
  suspicious: boolean;
  reasons: string[];
};

const SUSPICIOUS_ACCURACY_THRESHOLD = 3; // meters — real mobile GPS is rarely < 3m
const EXACT_COORD_TOLERANCE = 0.00001; // ~1 meter — if within this of branch center, it's exact
const REPEAT_COORD_TOLERANCE = 0.0001; // ~11 meters — if same spot every day, suspicious

/**
 * Check a single attendance record for GPS anomalies.
 */
export function detectAnomalies(
  lat: number | null,
  lng: number | null,
  accuracy: number | null,
  branchLat: number | null,
  branchLng: number | null,
  previousCoords: { lat: number; lng: number }[]
): AnomalyResult {
  const reasons: string[] = [];

  if (lat == null || lng == null) {
    return { suspicious: false, reasons: [] };
  }

  // 1. Accuracy too perfect
  if (accuracy != null && accuracy > 0 && accuracy < SUSPICIOUS_ACCURACY_THRESHOLD) {
    reasons.push(`دقة الموقع مثالية بشكل مشبوه (${accuracy.toFixed(1)}م) — الأجهزة الحقيقية عادة 5-30م`);
  }

  // 2. Exact branch center match
  if (branchLat != null && branchLng != null) {
    const latDiff = Math.abs(lat - branchLat);
    const lngDiff = Math.abs(lng - branchLng);
    if (latDiff < EXACT_COORD_TOLERANCE && lngDiff < EXACT_COORD_TOLERANCE) {
      reasons.push('الإحداثيات مطابقة تماماً لمركز الفرع — GPS حقيقي لا يعطي نفس النقطة بالضبط');
    }
  }

  // 3. Same coordinates repeated across previous check-ins
  if (previousCoords.length >= 2) {
    const matches = previousCoords.filter(
      (prev) =>
        Math.abs(prev.lat - lat) < REPEAT_COORD_TOLERANCE &&
        Math.abs(prev.lng - lng) < REPEAT_COORD_TOLERANCE
    );
    if (matches.length >= 2) {
      reasons.push(`نفس الإحداثيات تقريباً في ${matches.length} تسجيلات سابقة — لا يوجد تذبذب طبيعي`);
    }
  }

  return {
    suspicious: reasons.length > 0,
    reasons,
  };
}
