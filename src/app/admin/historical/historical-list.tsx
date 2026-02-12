'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ExcelJS from 'exceljs';
import { Upload, FileSpreadsheet } from 'lucide-react';

type Report = {
  id: string;
  title: string;
  year: number;
  reportDate: Date | null;
  fileUrl: string | null;
  fileName: string | null;
  summary: string | null;
};

type ParsedExcelReport = {
  title: string;
  projectNames: string[];
  days: { day: number; byProject: Record<string, number>; total: number }[];
  totalRow: Record<string, number>;
  grandTotal: number;
};

const MONTH_NAMES_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

const PROJECT_HEADER_COLORS = [
  'bg-amber-400/25 text-amber-100',      // وقف الحرم
  'bg-emerald-400/25 text-emerald-100',  // بناء مساجد
  'bg-orange-300/25 text-orange-100',    // سقيا الماء
  'bg-pink-400/25 text-pink-100',        // أوقف مصحف
  'bg-slate-400/25 text-slate-100',      // ترميم
  'bg-sky-400/25 text-sky-100',         // العناية
  'bg-green-400/25 text-green-100',     // صيانة
  'bg-blue-400/25 text-blue-100',        // سيارة صيانة
];

function OldReportTable({
  title,
  monthName,
  projectNames,
  days,
  totalRow,
  grandTotal,
}: {
  title: string;
  monthName?: string;
  projectNames: string[];
  days: { day: number; byProject: Record<string, number>; total: number }[];
  totalRow: Record<string, number>;
  grandTotal: number;
}) {
  const dayMap = Object.fromEntries(days.map((d) => [d.day, d]));
  const rows = Array.from({ length: 31 }, (_, i) => i + 1);
  return (
    <div className="rounded-xl border border-white/20 overflow-hidden bg-white/5">
      <div className="p-3 border-b border-white/10 text-right">
        <p className="text-white/90 font-medium">إيرادات من</p>
        <p className="text-sky-300 font-semibold">{monthName || title.replace(/^إيرادات من\s*/, '') || '—'}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] border-collapse text-right text-sm">
          <thead>
            <tr>
              <th className="p-2 border border-white/20 bg-sky-500/25 text-sky-100 font-semibold w-14">الرقم</th>
              {projectNames.map((name, i) => (
                <th
                  key={name}
                  className={`p-2 border border-white/20 font-semibold min-w-[100px] ${PROJECT_HEADER_COLORS[i % PROJECT_HEADER_COLORS.length]}`}
                >
                  {name}
                </th>
              ))}
              <th className="p-2 border border-white/20 bg-amber-400/35 text-amber-100 font-semibold min-w-[100px]">المجموع اليومي</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((day) => {
              const row = dayMap[day];
              const byProject = row?.byProject ?? {};
              const total = row?.total ?? 0;
              return (
                <tr key={day} className="hover:bg-white/5">
                  <td className="p-2 border border-white/20 text-white/90 bg-white/5">{day}</td>
                  {projectNames.map((name) => (
                    <td key={name} className="p-2 border border-white/20 text-white/80">
                      {byProject[name] != null && byProject[name] !== 0 ? Number(byProject[name]).toLocaleString('ar-SA') : ''}
                    </td>
                  ))}
                  <td className="p-2 border border-white/20 text-white font-medium bg-white/5">
                    {total !== 0 ? total.toLocaleString('ar-SA') : '0'}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-white/10 font-semibold">
              <td className="p-2 border border-white/20 text-amber-200">الاجمالي</td>
              {projectNames.map((name) => (
                <td key={name} className="p-2 border border-white/20 text-white/90">
                  {totalRow[name] != null && totalRow[name] !== 0 ? Number(totalRow[name]).toLocaleString('ar-SA') : ''}
                </td>
              ))}
              <td className="p-2 border border-white/20 text-amber-200 font-bold">
                {grandTotal.toLocaleString('ar-SA')} ر.س
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function getCellValue(cell: ExcelJS.Cell): string | number | null {
  const v = cell?.value;
  if (v == null) return null;
  if (typeof v === 'object' && 'text' in v) return (v as { text: string }).text;
  if (typeof v === 'object' && 'result' in v) return (v as { result: number }).result;
  return v as string | number;
}

function norm(s: string): string {
  return String(s ?? '').trim().replace(/\s+/g, ' ');
}

/** Parse "إيرادات من" + شهر + الرقم + project columns + المجموع اليومي (days 1-31, row الاجمالي). Flexible: finds header row and columns anywhere. */
function parseIncomeSheetStructure(ws: ExcelJS.Worksheet): ParsedExcelReport | null {
  const rowCount = (ws as { actualRowCount?: number }).actualRowCount ?? ws.rowCount ?? 40;
  const maxRow = Math.min(40, rowCount + 20);
  const maxCol = 50;
  let headerRowIndex = 0;
  let numCol = 0;
  let totalColIndex = 0;
  let monthName = '';
  let titleFromSheet = '';

  for (let r = 1; r <= maxRow; r++) {
    const row = ws.getRow(r);
    for (let c = 1; c <= maxCol; c++) {
      const val = norm(String(getCellValue(row.getCell(c)) ?? ''));
      if (val === 'الرقم' || (val.includes('الرقم') && val.length < 15)) numCol = c;
      if (val === 'المجموع اليومي' || (val.includes('المجموع') && val.includes('اليومي'))) totalColIndex = c;
    }
    if (numCol && totalColIndex) {
      headerRowIndex = r;
      break;
    }
    numCol = 0;
    totalColIndex = 0;
  }
  if (!headerRowIndex || !numCol || !totalColIndex) return null;

  const headerRow = ws.getRow(headerRowIndex);
  const projectNames: string[] = [];
  const minCol = Math.min(numCol, totalColIndex);
  const maxColHeader = Math.max(numCol, totalColIndex);
  for (let c = minCol + 1; c < maxColHeader; c++) {
    const val = norm(String(getCellValue(headerRow.getCell(c)) ?? ''));
    if (val && !val.includes('الرقم') && !val.includes('المجموع اليومي') && val !== 'المجموع') projectNames.push(val);
  }
  if (projectNames.length === 0) return null;

  for (let r = 1; r < headerRowIndex; r++) {
    const row = ws.getRow(r);
    for (let c = 1; c <= maxCol; c++) {
      const val = norm(String(getCellValue(row.getCell(c)) ?? ''));
      if (val.includes('إيرادات')) titleFromSheet = val;
      if (MONTH_NAMES_AR.includes(val)) monthName = val;
    }
  }
  if (!titleFromSheet && monthName) titleFromSheet = `إيرادات من ${monthName}`;
  if (!titleFromSheet) titleFromSheet = 'إيرادات من';

  const days: ParsedExcelReport['days'] = [];
  const totalRow: Record<string, number> = {};
  let grandTotal = 0;
  const dayCol = numCol;
  const totalCol = totalColIndex;
  const projectColStart = minCol + 1;

  for (let r = headerRowIndex + 1; r <= headerRowIndex + 35; r++) {
    const row = ws.getRow(r);
    const dayCell = getCellValue(row.getCell(dayCol));
    const dayStr = norm(String(dayCell ?? ''));
    if (dayStr === 'الاجمالي' || dayStr === 'الإجمالي' || dayStr.includes('اجمالي')) {
      for (let i = 0; i < projectNames.length; i++) {
        const v = getCellValue(row.getCell(projectColStart + i));
        totalRow[projectNames[i]] = typeof v === 'number' ? v : parseFloat(String(v ?? '0').replace(/,/g, '')) || 0;
      }
      const gt = getCellValue(row.getCell(totalCol));
      grandTotal = typeof gt === 'number' ? gt : parseFloat(String(gt ?? '0').replace(/,/g, '')) || 0;
      break;
    }
    const dayNum = typeof dayCell === 'number' ? dayCell : parseInt(String(dayCell ?? '').replace(/\s/g, ''), 10);
    if (!Number.isInteger(dayNum) || dayNum < 1 || dayNum > 31) continue;
    const byProject: Record<string, number> = {};
    let rowTotal = 0;
    for (let i = 0; i < projectNames.length; i++) {
      const v = getCellValue(row.getCell(projectColStart + i));
      const num = typeof v === 'number' ? v : parseFloat(String(v ?? '0').replace(/,/g, '')) || 0;
      byProject[projectNames[i]] = num;
      rowTotal += num;
    }
    const totalCell = getCellValue(row.getCell(totalCol));
    const dayTotal = typeof totalCell === 'number' ? totalCell : parseFloat(String(totalCell ?? '0').replace(/,/g, '')) || 0;
    if (rowTotal === 0 && dayTotal > 0) rowTotal = dayTotal;
    days.push({ day: dayNum, byProject, total: rowTotal });
  }

  if (days.length === 0) return null;
  const title = monthName ? `إيرادات من ${monthName}` : titleFromSheet;
  return { title, projectNames, days, totalRow, grandTotal };
}

function parseCharityExcelSheet(ws: ExcelJS.Worksheet): ParsedExcelReport | null {
  const parsedNew = parseIncomeSheetStructure(ws);
  if (parsedNew) return parsedNew;

  const titleCell = ws.getRow(1).getCell(1);
  const title = String(getCellValue(titleCell) ?? '').trim();
  if (!title) return null;

  let headerRowIndex = 0;
  for (let r = 2; r <= Math.min(20, (ws.rowCount || 0) + 5); r++) {
    const first = getCellValue(ws.getRow(r).getCell(1));
    if (String(first ?? '').trim() === 'اليوم') {
      headerRowIndex = r;
      break;
    }
  }
  if (!headerRowIndex) return null;

  const headerRow = ws.getRow(headerRowIndex);
  const projectNames: string[] = [];
  let col = 2;
  while (true) {
    const val = getCellValue(headerRow.getCell(col));
    const str = String(val ?? '').trim();
    if (!str || str === 'المجموع') break;
    projectNames.push(str);
    col++;
  }
  const totalColIndex = col;

  const days: ParsedExcelReport['days'] = [];
  const totalRow: Record<string, number> = {};
  let grandTotal = 0;

  for (let r = headerRowIndex + 1; r <= (ws.rowCount || 0) + 50; r++) {
    const firstCell = getCellValue(ws.getRow(r).getCell(1));
    const firstStr = String(firstCell ?? '').trim();
    if (firstStr === 'الإجمالي') {
      for (let c = 2; c <= totalColIndex; c++) {
        const v = getCellValue(ws.getRow(r).getCell(c));
        const num = typeof v === 'number' ? v : parseFloat(String(v ?? '0')) || 0;
        if (c <= totalColIndex - 1 && projectNames[c - 2]) totalRow[projectNames[c - 2]] = num;
        if (c === totalColIndex) grandTotal = num;
      }
      break;
    }
    const dayMatch = firstStr.match(/يوم\s*(\d+)/);
    if (!dayMatch) continue;
    const dayNum = parseInt(dayMatch[1], 10);
    const byProject: Record<string, number> = {};
    let rowTotal = 0;
    for (let c = 2; c <= totalColIndex; c++) {
      const v = getCellValue(ws.getRow(r).getCell(c));
      const num = typeof v === 'number' ? v : parseFloat(String(v ?? '0')) || 0;
      const name = projectNames[c - 2];
      if (name) byProject[name] = num;
      if (c < totalColIndex) rowTotal += num;
      else rowTotal = num;
    }
    days.push({ day: dayNum, byProject, total: rowTotal });
  }

  if (days.length === 0) return null;
  return { title, projectNames, days, totalRow, grandTotal };
}

export default function HistoricalList({ initialReports }: { initialReports: Report[] }) {
  const router = useRouter();
  const [reports, setReports] = useState(initialReports);
  const [title, setTitle] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadMode, setUploadMode] = useState<'manual' | 'excel'>('excel');
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedExcelReport | null>(null);
  const [parseError, setParseError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function getSummaryData(summary: string | null): ParsedExcelReport | null {
    if (!summary) return null;
    try {
      const data = JSON.parse(summary) as { type?: string; title?: string; projectNames?: string[]; days?: ParsedExcelReport['days']; totalRow?: Record<string, number>; grandTotal?: number };
      if (data.type !== 'charity-monthly' || !data.projectNames?.length || !Array.isArray(data.days)) return null;
      return {
        title: data.title || 'تقرير',
        projectNames: data.projectNames,
        days: data.days,
        totalRow: data.totalRow ?? {},
        grandTotal: data.grandTotal ?? 0,
      };
    } catch {
      return null;
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setParseError('');
    setParsed(null);
    setExcelFile(null);
    if (!file) return;
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setParseError('يرجى اختيار ملف Excel (.xlsx)');
      return;
    }
    try {
      const buf = await file.arrayBuffer();
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buf);
      let ws = wb.worksheets[0];
      if (!ws) {
        setParseError('الملف لا يحتوي على أوراق');
        return;
      }
      let result = parseCharityExcelSheet(ws);
      if (!result && wb.worksheets.length > 1) {
        for (let i = 1; i < wb.worksheets.length && !result; i++) {
          result = parseCharityExcelSheet(wb.worksheets[i]);
        }
      }
      if (!result) {
        setParseError('لم يتم التعرف على بنية التقرير. تأكد أن الملف يحتوي على صف عناوين فيه «الرقم» و«المجموع اليومي» وأعمدة للمشاريع بينهما، ثم صفوف الأيام (1-31) ثم صف «الاجمالي».');
        return;
      }
      setParsed(result);
      setExcelFile(file);
      setTitle(result.title);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'فشل قراءة الملف');
    }
  };

  const saveUploadedExcel = async () => {
    if (!parsed || !excelFile) return;
    setUploading(true);
    try {
      const reportDate = new Date(year, 0, 1);
      const monthMatch = parsed.title.match(/شهر\s*(.+?)\s*-/);
      if (monthMatch) {
        const monthName = monthMatch[1].trim();
        const mi = MONTH_NAMES_AR.indexOf(monthName);
        if (mi >= 0) reportDate.setMonth(mi);
      }
      const summaryJson = JSON.stringify({
        type: 'charity-monthly',
        title: parsed.title,
        projectNames: parsed.projectNames,
        days: parsed.days,
        totalRow: parsed.totalRow,
        grandTotal: parsed.grandTotal,
      });
      const res = await fetch('/api/historical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: parsed.title,
          year,
          reportDate: reportDate.toISOString(),
          fileUrl: null,
          fileName: excelFile.name,
          summary: summaryJson,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setParseError(err.error || 'فشل الحفظ');
        setUploading(false);
        return;
      }
      const newReport = await res.json();
      setReports((prev) => [newReport, ...prev]);
      setParsed(null);
      setExcelFile(null);
      setTitle('');
      router.refresh();
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'فشل الحفظ');
    } finally {
      setUploading(false);
    }
  };

  const addReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/historical', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title || `تقرير ${year}`,
        year,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        summary: summary || null,
      }),
    });
    setLoading(false);
    if (!res.ok) return;
    const newReport = await res.json();
    setReports((prev) => [newReport, ...prev]);
    setTitle('');
    setFileUrl('');
    setFileName('');
    setSummary('');
    router.refresh();
  };

  const deleteReport = async (id: string) => {
    if (!confirm('حذف هذا التقرير؟')) return;
    const res = await fetch(`/api/historical/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setReports((prev) => prev.filter((r) => r.id !== id));
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card space-y-4">
        <h2 className="text-lg font-semibold text-white">رفع تقرير تاريخي</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setUploadMode('excel')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${uploadMode === 'excel' ? 'bg-white/20 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
          >
            <span className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              رفع من الجهاز (Excel)
            </span>
          </button>
          <button
            type="button"
            onClick={() => setUploadMode('manual')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${uploadMode === 'manual' ? 'bg-white/20 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
          >
            إدخال يدوي
          </button>
        </div>

        {uploadMode === 'excel' && (
          <div className="space-y-4 pt-2 border-t border-white/10">
            <p className="text-white/70 text-sm">
              اختر ملف Excel بنفس بنية تقرير الجمعيات (تقرير شهر X - جمعية Y، مع صف العناوين والأيام والإجمالي). سيتم استخراج الأرقام وحفظها في النظام.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
              id="historical-excel-upload"
            />
            <label
              htmlFor="historical-excel-upload"
              className="flex items-center justify-center gap-2 w-full max-w-xs py-4 px-4 rounded-xl border-2 border-dashed border-white/30 hover:border-emerald-400/60 hover:bg-white/5 transition-colors cursor-pointer text-white/80"
            >
              <Upload className="w-6 h-6" />
              <span>اختر ملف Excel من الجهاز</span>
            </label>
            {parseError && <p className="text-red-400 text-sm">{parseError}</p>}
            {parsed && (
              <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-4">
                <p className="text-emerald-400 text-sm font-medium">تم قراءة التقرير بنجاح</p>
                <p className="text-white/90">{parsed.title}</p>
                <p className="text-white/70 text-sm">
                  {parsed.days.length} يوم، {parsed.projectNames.length} مشروع، الإجمالي: {parsed.grandTotal.toLocaleString('ar-SA')} ر.س
                </p>
                <div className="rounded-xl border border-white/10 overflow-hidden">
                  <OldReportTable
                    title={parsed.title}
                    monthName={parsed.title.replace(/^إيرادات من\s*/, '').trim() || undefined}
                    projectNames={parsed.projectNames}
                    days={parsed.days}
                    totalRow={parsed.totalRow}
                    grandTotal={parsed.grandTotal}
                  />
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                  <div>
                    <label className="block text-sm text-white/70 mb-1">السنة</label>
                    <input
                      type="number"
                      className="input-glass w-28"
                      min={2000}
                      max={2100}
                      value={year}
                      onChange={(e) => setYear(parseInt(e.target.value, 10) || new Date().getFullYear())}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={saveUploadedExcel}
                    disabled={uploading}
                    className="btn-primary mt-6"
                  >
                    {uploading ? 'جاري الحفظ...' : 'حفظ الأرقام في النظام'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setParsed(null); setExcelFile(null); setParseError(''); }}
                    className="btn-ghost"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {uploadMode === 'manual' && (
          <form onSubmit={addReport} className="space-y-4 pt-2 border-t border-white/10">
            <p className="text-white/70 text-sm">
              أضف تقريرًا يدويًا (رابط ملف أو ملخص أرقام).
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/80 mb-1">العنوان</label>
                <input className="input-glass" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="تقرير 2023" />
              </div>
              <div>
                <label className="block text-sm text-white/80 mb-1">السنة</label>
                <input type="number" className="input-glass" value={year} onChange={(e) => setYear(parseInt(e.target.value, 10))} />
              </div>
            </div>
            <div>
              <label className="block text-sm text-white/80 mb-1">رابط الملف (اختياري)</label>
              <input className="input-glass" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm text-white/80 mb-1">اسم الملف</label>
              <input className="input-glass" value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="report-2023.pdf" />
            </div>
            <div>
              <label className="block text-sm text-white/80 mb-1">ملخص أو أرقام (اختياري)</label>
              <textarea className="input-glass min-h-[80px]" value={summary} onChange={(e) => setSummary(e.target.value)} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'جاري الحفظ...' : 'إضافة التقرير'}
            </button>
          </form>
        )}
      </div>

      <div className="glass-card">
        <h2 className="text-lg font-semibold text-white mb-4">قائمة التقارير التاريخية</h2>
        <ul className="space-y-2">
          {reports.map((r) => {
            const summaryData = getSummaryData(r.summary);
            const isExpanded = expandedId === r.id;
            return (
              <li key={r.id} className="border-b border-white/10 last:border-0">
                <div className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <span className="text-white font-medium">{r.title}</span>
                    <span className="text-white/60 text-sm mr-2"> — {r.year}</span>
                    {r.fileName && <span className="text-white/50 text-sm">({r.fileName})</span>}
                    {r.fileUrl && (
                      <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-400 text-sm ml-2">
                        فتح الملف
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {summaryData && (
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : r.id)}
                        className="btn-ghost text-sky-400 text-sm"
                      >
                        {isExpanded ? 'إخفاء الجدول' : 'عرض الجدول'}
                      </button>
                    )}
                    <button type="button" onClick={() => deleteReport(r.id)} className="btn-ghost text-red-400 text-sm">
                      حذف
                    </button>
                  </div>
                </div>
                {summaryData && isExpanded && (
                  <div className="pb-4 pt-2">
                    <OldReportTable
                      title={summaryData.title}
                      monthName={r.reportDate ? MONTH_NAMES_AR[new Date(r.reportDate).getMonth()] : undefined}
                      projectNames={summaryData.projectNames}
                      days={summaryData.days}
                      totalRow={summaryData.totalRow}
                      grandTotal={summaryData.grandTotal}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        {reports.length === 0 && <p className="text-white/60">لا توجد تقارير تاريخية</p>}
      </div>
    </div>
  );
}
