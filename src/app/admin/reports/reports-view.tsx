'use client';

import { useState, useEffect } from 'react';
// ExcelJS is lazy-loaded at download time to avoid 224KB in initial bundle
import { FileText, Building2, ClipboardList, MapPin, Download } from 'lucide-react';

type ReportKind = 'charity' | 'attendance' | 'branch';

type Charity = { id: string; name: string };
type Branch = { id: string; name: string };
type CharityMonthlyData = {
  charityName: string;
  year: number;
  month: number;
  monthName: string;
  projects: { id: string; name: string }[];
  days: { day: number; byProject: Record<string, number>; total: number }[];
  totalDonationsInRange?: number;
};
type AttendanceData = {
  year: number;
  month: number;
  daysInMonth: number;
  employees: { name: string; staffId: string; daysPresent: number; daysAbsent: number; lateMinutes: number; lateHours: number }[];
};
type BranchMonthlyData = {
  branchName: string;
  year: number;
  month: number;
  daysInMonth: number;
  projects: { id: string; name: string; charityName: string }[];
  days: { day: number; byProject: Record<string, number>; total: number }[];
  employeeSummary: { id: string; name: string; staffId: string; total: number; count: number }[];
  totalDonations: number;
  grandTotal: number;
};

const MONTH_NAMES = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

function colLetter(n: number): string {
  let s = '';
  while (n > 0) {
    n--;
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26);
  }
  return s || 'A';
}

async function loadExcelJS() {
  const mod = await import('exceljs');
  return mod.default;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function downloadWorkbook(wb: any, filename: string) {
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const headerFill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF1e3a5f' } };
const headerFont = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
const totalFill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF2d5a87' } };
const totalFont = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
const subHeaderFill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF3b7dd8' } };
const thinBorder = {
  top: { style: 'thin' as const },
  bottom: { style: 'thin' as const },
  left: { style: 'thin' as const },
  right: { style: 'thin' as const },
};
const titleFont = { bold: true, size: 14, color: { argb: 'FF1e3a5f' } };

const reportTypes: { kind: ReportKind; label: string; icon: typeof Building2; desc: string }[] = [
  { kind: 'charity', label: 'تقرير الجمعيات', icon: Building2, desc: 'دخل شهري حسب المشاريع لكل جمعية' },
  { kind: 'branch', label: 'تقرير الفروع', icon: MapPin, desc: 'تفاصيل تبرعات الفرع الشهرية وأداء الموظفين' },
  { kind: 'attendance', label: 'تقرير الحضور', icon: ClipboardList, desc: 'حضور وغياب وتأخر الموظفين' },
];

export default function ReportsView() {
  const [kind, setKind] = useState<ReportKind>('charity');
  const [charities, setCharities] = useState<Charity[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [charityId, setCharityId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/charities').then((r) => r.json()).catch(() => []),
      fetch('/api/branches').then((r) => r.json()).catch(() => []),
    ]).then(([c, b]) => {
      setCharities(Array.isArray(c) ? c : []);
      setBranches(Array.isArray(b) ? b : []);
    });
  }, []);

  const resetMessages = () => { setError(''); setSuccess(''); };

  // ── Charity Report ──
  const downloadCharityExcel = async () => {
    if (!charityId) { setError('اختر الجمعية'); return; }
    resetMessages();
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/charity-monthly?charityId=${encodeURIComponent(charityId)}&year=${year}&month=${month}`);
      const data: CharityMonthlyData & { error?: string } = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل التحميل');
      if ((data.totalDonationsInRange ?? 0) === 0) {
        setError('لا توجد تبرعات مسجلة لهذه الجمعية في الشهر والسنة المحددين.');
        setLoading(false);
        return;
      }

      const totalByProject = data.projects.map((p) =>
        data.days.reduce((sum, d) => sum + (d.byProject[p.id] ?? 0), 0)
      );
      const grandTotal = totalByProject.reduce((a, b) => a + b, 0);

      const ExcelJS = await loadExcelJS();
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet(`تقرير ${data.monthName}`, { views: [{ rightToLeft: true }] });

      const numCols = data.projects.length + 2;
      ws.mergeCells('A1', `${colLetter(numCols)}1`);
      const titleCell = ws.getCell(1, 1);
      titleCell.value = `تقرير شهر ${data.monthName} ${data.year} - ${data.charityName}`;
      titleCell.font = titleFont;
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getRow(1).height = 28;

      const headers = ['اليوم', ...data.projects.map((p) => p.name), 'المجموع'];
      const headerRow = ws.addRow(headers);
      headerRow.height = 22;
      headerRow.eachCell((cell, colNumber) => {
        cell.fill = headerFill;
        cell.font = headerFont;
        cell.border = thinBorder;
        cell.alignment = { horizontal: colNumber === 1 ? 'right' : 'center', vertical: 'middle', wrapText: true };
      });

      data.days.forEach((d, idx) => {
        const row = ws.addRow([`يوم ${d.day}`, ...data.projects.map((p) => d.byProject[p.id] ?? 0), d.total]);
        const isEven = idx % 2 === 0;
        row.eachCell((cell, colNumber) => {
          cell.border = thinBorder;
          cell.alignment = { horizontal: colNumber === 1 ? 'right' : 'center', vertical: 'middle' };
          if (isEven) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F7FA' } };
          if (colNumber > 1) cell.numFmt = '#,##0';
        });
      });

      const totalRow = ws.addRow(['الإجمالي', ...totalByProject, grandTotal]);
      totalRow.height = 24;
      totalRow.eachCell((cell, colNumber) => {
        cell.fill = totalFill;
        cell.font = totalFont;
        cell.border = thinBorder;
        cell.alignment = { horizontal: colNumber === 1 ? 'right' : 'center', vertical: 'middle' };
        if (colNumber > 1) cell.numFmt = '#,##0';
      });

      for (let c = 1; c <= numCols; c++) ws.getColumn(c).width = 14;

      await downloadWorkbook(wb, `تقرير_${data.charityName}_${data.monthName}_${data.year}.xlsx`);
      setSuccess('تم تحميل التقرير بنجاح');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل تحميل التقرير');
    } finally {
      setLoading(false);
    }
  };

  // ── Branch Report ──
  const downloadBranchExcel = async () => {
    if (!branchId) { setError('اختر الفرع'); return; }
    resetMessages();
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/branch-monthly?branchId=${encodeURIComponent(branchId)}&year=${year}&month=${month}`);
      const data: BranchMonthlyData & { error?: string } = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل التحميل');
      if (data.totalDonations === 0) {
        setError('لا توجد تبرعات مسجلة لهذا الفرع في الشهر والسنة المحددين.');
        setLoading(false);
        return;
      }

      const ExcelJS = await loadExcelJS();
      const wb = new ExcelJS.Workbook();

      // ── Sheet 1: Daily breakdown by project ──
      const ws1 = wb.addWorksheet('التبرعات اليومية', { views: [{ rightToLeft: true }] });
      const numCols = data.projects.length + 2;

      ws1.mergeCells('A1', `${colLetter(numCols)}1`);
      const t1 = ws1.getCell(1, 1);
      t1.value = `تقرير فرع ${data.branchName} - ${MONTH_NAMES[month - 1]} ${year}`;
      t1.font = titleFont;
      t1.alignment = { horizontal: 'center', vertical: 'middle' };
      ws1.getRow(1).height = 28;

      // Charity sub-header
      ws1.mergeCells('A2', `${colLetter(numCols)}2`);
      const subCell = ws1.getCell(2, 1);
      subCell.value = `التبرعات اليومية حسب المشروع — ${data.totalDonations} عملية — إجمالي ${data.grandTotal.toLocaleString()} ر.س`;
      subCell.font = { bold: true, size: 10, color: { argb: 'FF64748b' } };
      subCell.alignment = { horizontal: 'center', vertical: 'middle' };
      ws1.getRow(2).height = 20;

      const headers = ['اليوم', ...data.projects.map((p) => `${p.name}\n(${p.charityName})`), 'المجموع'];
      const headerRow = ws1.addRow(headers);
      headerRow.height = 32;
      headerRow.eachCell((cell, colNumber) => {
        cell.fill = headerFill;
        cell.font = headerFont;
        cell.border = thinBorder;
        cell.alignment = { horizontal: colNumber === 1 ? 'right' : 'center', vertical: 'middle', wrapText: true };
      });

      const totalByProject = data.projects.map((p) =>
        data.days.reduce((sum, d) => sum + (d.byProject[p.id] ?? 0), 0)
      );

      data.days.forEach((d, idx) => {
        const row = ws1.addRow([`يوم ${d.day}`, ...data.projects.map((p) => d.byProject[p.id] ?? 0), d.total]);
        const isEven = idx % 2 === 0;
        row.eachCell((cell, colNumber) => {
          cell.border = thinBorder;
          cell.alignment = { horizontal: colNumber === 1 ? 'right' : 'center', vertical: 'middle' };
          if (isEven) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F7FA' } };
          if (colNumber > 1) cell.numFmt = '#,##0';
        });
      });

      const totRow = ws1.addRow(['الإجمالي', ...totalByProject, data.grandTotal]);
      totRow.height = 24;
      totRow.eachCell((cell, colNumber) => {
        cell.fill = totalFill;
        cell.font = totalFont;
        cell.border = thinBorder;
        cell.alignment = { horizontal: colNumber === 1 ? 'right' : 'center', vertical: 'middle' };
        if (colNumber > 1) cell.numFmt = '#,##0';
      });

      for (let c = 1; c <= numCols; c++) ws1.getColumn(c).width = c === 1 ? 12 : 16;

      // ── Sheet 2: Employee performance ──
      const ws2 = wb.addWorksheet('أداء الموظفين', { views: [{ rightToLeft: true }] });

      ws2.mergeCells('A1', 'D1');
      const t2 = ws2.getCell(1, 1);
      t2.value = `أداء موظفي فرع ${data.branchName} - ${MONTH_NAMES[month - 1]} ${year}`;
      t2.font = titleFont;
      t2.alignment = { horizontal: 'center', vertical: 'middle' };
      ws2.getRow(1).height = 28;

      const empHeaders = ['اسم الموظف', 'رقم الموظف', 'عدد العمليات', 'إجمالي التبرعات (ر.س)'];
      const empHeaderRow = ws2.addRow(empHeaders);
      empHeaderRow.height = 22;
      empHeaderRow.eachCell((cell) => {
        cell.fill = subHeaderFill;
        cell.font = headerFont;
        cell.border = thinBorder;
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      });

      const sorted = [...data.employeeSummary].sort((a, b) => b.total - a.total);
      sorted.forEach((emp, idx) => {
        const row = ws2.addRow([emp.name, emp.staffId, emp.count, emp.total]);
        const isEven = idx % 2 === 0;
        row.eachCell((cell, colNumber) => {
          cell.border = thinBorder;
          cell.alignment = { horizontal: colNumber <= 2 ? 'right' : 'center', vertical: 'middle' };
          if (isEven) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F7FA' } };
          if (colNumber >= 3) cell.numFmt = '#,##0';
        });
      });

      const empTotalRow = ws2.addRow(['الإجمالي', '', data.totalDonations, data.grandTotal]);
      empTotalRow.height = 24;
      empTotalRow.eachCell((cell, colNumber) => {
        cell.fill = totalFill;
        cell.font = totalFont;
        cell.border = thinBorder;
        cell.alignment = { horizontal: colNumber <= 2 ? 'right' : 'center', vertical: 'middle' };
        if (colNumber >= 3) cell.numFmt = '#,##0';
      });

      ws2.getColumn(1).width = 22;
      ws2.getColumn(2).width = 14;
      ws2.getColumn(3).width = 16;
      ws2.getColumn(4).width = 22;

      await downloadWorkbook(wb, `تقرير_فرع_${data.branchName}_${MONTH_NAMES[month - 1]}_${year}.xlsx`);
      setSuccess('تم تحميل التقرير بنجاح');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل تحميل التقرير');
    } finally {
      setLoading(false);
    }
  };

  // ── Attendance Report ──
  const downloadAttendanceExcel = async () => {
    resetMessages();
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/attendance?year=${year}&month=${month}`);
      const data: AttendanceData & { error?: string } = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل التحميل');

      const ExcelJS = await loadExcelJS();
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('الحضور', { views: [{ rightToLeft: true }] });

      ws.mergeCells('A1', 'F1');
      ws.getRow(1).height = 28;
      const titleCell = ws.getCell(1, 1);
      titleCell.value = `تقرير الحضور - ${MONTH_NAMES[month - 1]} ${year}`;
      titleCell.font = titleFont;
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

      const headers = ['اسم الموظف', 'رقم الموظف', 'أيام الحضور', 'أيام الغياب', 'دقائق التأخر', 'ساعات التأخر'];
      const headerRow = ws.addRow(headers);
      headerRow.height = 22;
      headerRow.eachCell((cell) => {
        cell.fill = headerFill;
        cell.font = headerFont;
        cell.border = thinBorder;
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      });

      data.employees.forEach((e, idx) => {
        const row = ws.addRow([e.name, e.staffId, e.daysPresent, e.daysAbsent, e.lateMinutes, e.lateHours]);
        const isEven = idx % 2 === 0;
        row.eachCell((cell, colNumber) => {
          cell.border = thinBorder;
          cell.alignment = { horizontal: colNumber <= 2 ? 'right' : 'center', vertical: 'middle' };
          if (isEven) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F7FA' } };
          if (colNumber >= 3) cell.numFmt = colNumber === 6 ? '0.0' : '#,##0';
        });
      });

      ws.getColumn(1).width = 22;
      ws.getColumn(2).width = 14;
      ws.getColumn(3).width = 14;
      ws.getColumn(4).width = 14;
      ws.getColumn(5).width = 14;
      ws.getColumn(6).width = 14;

      await downloadWorkbook(wb, `تقرير_الحضور_${MONTH_NAMES[month - 1]}_${year}.xlsx`);
      setSuccess('تم تحميل التقرير بنجاح');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل تحميل التقرير');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (kind === 'charity') downloadCharityExcel();
    else if (kind === 'branch') downloadBranchExcel();
    else downloadAttendanceExcel();
  };

  return (
    <div className="space-y-6">
      {/* Report type selector */}
      <div className="glass-card">
        <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-400" />
          نوع التقرير
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {reportTypes.map((rt) => {
            const active = kind === rt.kind;
            return (
              <button
                key={rt.kind}
                type="button"
                onClick={() => { setKind(rt.kind); resetMessages(); }}
                className={`rounded-xl p-4 text-right transition-all duration-200 border ${
                  active
                    ? 'border-emerald-500/30 bg-emerald-500/10'
                    : 'border-transparent hover:border-white/10'
                }`}
                style={{ background: active ? undefined : 'var(--table-row-hover)' }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${active ? 'bg-emerald-500/20' : 'bg-white/5'}`}>
                    <rt.icon className={`w-4 h-4 ${active ? 'text-emerald-400' : 'text-white/40'}`} />
                  </div>
                  <span className={`font-medium text-sm ${active ? 'text-emerald-400' : 'text-white/80'}`}>{rt.label}</span>
                </div>
                <p className="text-white/40 text-xs">{rt.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card">
        <div className="flex flex-wrap gap-4 items-end">
          {kind === 'charity' && (
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm text-white/60 mb-1">الجمعية</label>
              <select className="input-glass" value={charityId} onChange={(e) => setCharityId(e.target.value)}>
                <option value="">— اختر الجمعية —</option>
                {charities.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {kind === 'branch' && (
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm text-white/60 mb-1">الفرع</label>
              <select className="input-glass" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                <option value="">— اختر الفرع —</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="min-w-[140px]">
            <label className="block text-sm text-white/60 mb-1">الشهر</label>
            <select className="input-glass" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {MONTH_NAMES.map((name, i) => (
                <option key={i} value={i + 1}>{name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1">السنة</label>
            <input
              type="number"
              className="input-glass w-24"
              min={2020}
              max={2100}
              value={year}
              onChange={(e) => setYear(Number(e.target.value) || new Date().getFullYear())}
            />
          </div>

          <button
            type="button"
            onClick={handleDownload}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                جاري التحميل...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                تحميل Excel
              </>
            )}
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-emerald-400 text-sm">{success}</p>
        </div>
      )}

      {/* Description */}
      <div className="glass-card">
        <h3 className="text-sm font-medium text-white/80 mb-2">عن هذا التقرير</h3>
        {kind === 'charity' && (
          <p className="text-white/50 text-sm leading-relaxed">
            تقرير الجمعيات يعرض كل أيام الشهر مع إيرادات كل مشروع تابع للجمعية المختارة يومياً، والمجموع اليومي والإجمالي الشهري (كل الفروع مجمعة).
          </p>
        )}
        {kind === 'branch' && (
          <p className="text-white/50 text-sm leading-relaxed">
            تقرير الفروع يحتوي على ورقتين: <strong className="text-white/70">التبرعات اليومية</strong> تعرض تفاصيل التبرعات يومياً لكل مشروع في الفرع مع اسم الجمعية، و<strong className="text-white/70">أداء الموظفين</strong> تعرض إجمالي تبرعات كل موظف وعدد عملياته مرتبة من الأعلى.
          </p>
        )}
        {kind === 'attendance' && (
          <p className="text-white/50 text-sm leading-relaxed">
            تقرير الحضور يعرض كل الموظفين مع أيام الحضور والغياب ودقائق وساعات التأخر عن بداية الدوام للشهر المحدد.
          </p>
        )}
      </div>
    </div>
  );
}
