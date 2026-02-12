'use client';

import { useState, useEffect } from 'react';
import ExcelJS from 'exceljs';

type ReportKind = 'charity' | 'attendance';

type Charity = { id: string; name: string };
type CharityMonthlyData = {
  charityName: string;
  year: number;
  month: number;
  monthName: string;
  projects: { id: string; name: string }[];
  days: { day: number; byProject: Record<string, number>; total: number }[];
};
type AttendanceData = {
  year: number;
  month: number;
  daysInMonth: number;
  employees: { name: string; staffId: string; daysPresent: number; daysAbsent: number; lateMinutes: number; lateHours: number }[];
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

async function downloadWorkbook(wb: ExcelJS.Workbook, filename: string) {
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const headerFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1e3a5f' } };
const headerFont = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
const totalFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2d5a87' } };
const totalFont = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin' },
  bottom: { style: 'thin' },
  left: { style: 'thin' },
  right: { style: 'thin' },
};
const titleFont = { bold: true, size: 14, color: { argb: 'FF1e3a5f' } };

export default function ReportsView() {
  const [kind, setKind] = useState<ReportKind>('charity');
  const [charities, setCharities] = useState<Charity[]>([]);
  const [charityId, setCharityId] = useState('');
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/charities')
      .then((r) => r.json())
      .then((list: Charity[]) => setCharities(Array.isArray(list) ? list : []))
      .catch(() => setCharities([]));
  }, []);

  const downloadCharityExcel = async () => {
    if (!charityId) {
      setError('اختر الجمعية');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/charity-monthly?charityId=${encodeURIComponent(charityId)}&year=${year}&month=${month}`);
      const data: CharityMonthlyData & { totalDonationsInRange?: number; error?: string } = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل التحميل');
      if ((data.totalDonationsInRange ?? 0) === 0) {
        setError('لا توجد تبرعات مسجلة لهذه الجمعية في الشهر والسنة المحددين. تحقق من الجمعية والشهر.');
      } else {
        setError('');
      }

      const totalByProject = data.projects.map((p) =>
        data.days.reduce((sum, d) => sum + (d.byProject[p.id] ?? 0), 0)
      );
      const grandTotal = totalByProject.reduce((a, b) => a + b, 0);

      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet(`تقرير ${data.monthName}`, { views: [{ rightToLeft: true }] });

      const numCols = data.projects.length + 2;
      ws.mergeCells('A1', `${colLetter(numCols)}1`);
      const titleCell = ws.getCell(1, 1);
      titleCell.value = `تقرير شهر ${data.monthName} - ${data.charityName}`;
      titleCell.font = titleFont;
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

      const headers = ['اليوم', ...data.projects.map((p) => p.name), 'المجموع'];
      const headerRow = ws.addRow(headers);
      headerRow.height = 22;
      headerRow.eachCell((cell, colNumber) => {
        cell.fill = headerFill;
        cell.font = headerFont;
        cell.border = thinBorder;
        cell.alignment = { horizontal: colNumber === 1 ? 'right' : 'center', vertical: 'middle', wrapText: true };
      });
      ws.getRow(2).height = 22;

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

      for (let c = 1; c <= numCols; c++) {
        ws.getColumn(c).width = c === 1 ? 14 : 14;
      }
      ws.getRow(1).height = 28;

      await downloadWorkbook(wb, `تقرير_${data.charityName}_${data.monthName}_${data.year}.xlsx`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل تحميل التقرير');
    } finally {
      setLoading(false);
    }
  };

  const downloadAttendanceExcel = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/attendance?year=${year}&month=${month}`);
      const data: AttendanceData & { error?: string } = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل التحميل');

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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل تحميل التقرير');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card">
        <h2 className="text-lg font-semibold text-white mb-4">نوع التقرير</h2>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="reportKind"
              checked={kind === 'charity'}
              onChange={() => setKind('charity')}
              className="rounded border-white/30"
            />
            <span className="text-white">جمعيات (دخل شهري حسب المشاريع)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="reportKind"
              checked={kind === 'attendance'}
              onChange={() => setKind('attendance')}
              className="rounded border-white/30"
            />
            <span className="text-white">حضور الموظفين</span>
          </label>
        </div>
      </div>

      <div className="glass-card flex flex-wrap gap-4 items-end">
        {kind === 'charity' && (
          <div>
            <label className="block text-sm text-white/80 mb-1">الجمعية</label>
            <select
              className="input-glass min-w-[200px]"
              value={charityId}
              onChange={(e) => setCharityId(e.target.value)}
            >
              <option value="">— اختر الجمعية —</option>
              {charities.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm text-white/80 mb-1">الشهر</label>
          <select
            className="input-glass"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {MONTH_NAMES.map((name, i) => (
              <option key={i} value={i + 1}>{name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-white/80 mb-1">السنة</label>
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
          onClick={kind === 'charity' ? downloadCharityExcel : downloadAttendanceExcel}
          disabled={loading}
          className="btn-primary"
        >
          {loading ? 'جاري التحميل...' : 'تحميل Excel'}
        </button>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {kind === 'charity' && (
        <p className="text-white/70 text-sm">
          تقرير الجمعيات: يعرض كل أيام الشهر (حتى لو لم يكتمل أو لا توجد إيرادات في بعض الأيام)، مع إجمالي كل مشروع في اليوم والمجموع اليومي (كل الفروع مجمعة).
        </p>
      )}
      {kind === 'attendance' && (
        <p className="text-white/70 text-sm">
          تقرير الحضور: يعرض كل الموظفين مع أيام الحضور وأيام الغياب وساعات التأخر عن وقت الدوام.
        </p>
      )}
    </div>
  );
}
