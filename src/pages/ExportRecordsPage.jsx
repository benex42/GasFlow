import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  ReceiptText,
} from "lucide-react";
import { api } from "../api";

const reportOptions = [
  { id: "sales", label: "Sales records", description: "All completed sales and payment methods", icon: ReceiptText },
  { id: "summary", label: "Daily summary", description: "Cylinder quantities, revenue and shift totals", icon: FileSpreadsheet },
  { id: "credit", label: "Credit balances", description: "Customers with unpaid refill balances", icon: FileText },
];

const dateInputValue = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const recordDate = (value) => {
  const rawValue = String(value || "");
  const date = new Date(rawValue.includes("T") ? rawValue : `${rawValue.replace(" ", "T")}Z`);
  return Number.isNaN(date.getTime()) ? "" : dateInputValue(date);
};

const formatCurrency = (amount) => new Intl.NumberFormat("en-GH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(amount);

const paymentLabel = (method) => (
  method === "mobile_money" ? "Mobile Money" : method === "credit" ? "Credit" : "Cash"
);

const escapeCsv = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

function downloadFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function createPdf(title, period, columns, rows) {
  const toPdfText = (value) => String(value ?? "")
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)")
    .replace(/[^\x20-\x7E]/g, "?");
  const lines = [title, `Period: ${period}`, "", columns.join(" | "), ...rows.map((row) => row.join(" | "))]
    .flatMap((line) => {
      const cleanLine = toPdfText(line);
      return cleanLine.length > 105
        ? cleanLine.match(/.{1,105}(?:\s|$)|.{1,105}/g) || [cleanLine]
        : [cleanLine];
    });
  const pageLines = [];
  for (let index = 0; index < lines.length; index += 46) pageLines.push(lines.slice(index, index + 46));
  if (pageLines.length === 0) pageLines.push([title, `Period: ${period}`, "", "No records found."]);

  const fontObject = 3 + pageLines.length * 2;
  const objects = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = `<< /Type /Pages /Kids [${pageLines.map((_, index) => `${3 + index * 2} 0 R`).join(" ")}] /Count ${pageLines.length} >>`;
  pageLines.forEach((linesForPage, index) => {
    const pageObject = 3 + index * 2;
    const contentObject = pageObject + 1;
    const stream = `BT\n/F1 10 Tf\n50 760 Td\n14 TL\n${linesForPage.map((line) => `(${line}) Tj\nT*`).join("\n")}\nET`;
    objects[pageObject] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontObject} 0 R >> >> /Contents ${contentObject} 0 R >>`;
    objects[contentObject] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  });
  objects[fontObject] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

  let documentText = "%PDF-1.4\n";
  const offsets = [0];
  for (let index = 1; index <= fontObject; index += 1) {
    offsets[index] = documentText.length;
    documentText += `${index} 0 obj\n${objects[index]}\nendobj\n`;
  }
  const xrefOffset = documentText.length;
  documentText += `xref\n0 ${fontObject + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index <= fontObject; index += 1) {
    documentText += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  documentText += `trailer\n<< /Size ${fontObject + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new Blob([documentText], { type: "application/pdf" });
}

function buildReport(reportId, sales, debts, fromDate, toDate) {
  const isInRange = (value) => {
    const date = recordDate(value);
    return date && date >= fromDate && date <= toDate;
  };
  const salesInRange = sales.filter((sale) => isInRange(sale.sold_at));

  if (reportId === "summary") {
    const daily = new Map();
    salesInRange.forEach((sale) => {
      const date = recordDate(sale.sold_at);
      const entry = daily.get(date) || { date, sales: 0, cylinders: 0, revenue: 0 };
      entry.sales += 1;
      entry.cylinders += Number(sale.quantity) || 0;
      entry.revenue += (Number(sale.total_pesewas) || 0) / 100;
      daily.set(date, entry);
    });
    return {
      title: "GasFlow daily sales summary",
      columns: ["Date", "Sales", "Cylinders", "Revenue (GHS)"],
      rows: [...daily.values()].sort((first, second) => first.date.localeCompare(second.date)).map((entry) => [
        entry.date, entry.sales, entry.cylinders, formatCurrency(entry.revenue),
      ]),
    };
  }

  if (reportId === "credit") {
    return {
      title: "GasFlow outstanding credit balances",
      columns: ["Sale date", "Customer", "Cylinder", "Quantity", "Balance owed (GHS)"],
      rows: debts.filter((debt) => isInRange(debt.sold_at)).map((debt) => [
        recordDate(debt.sold_at), debt.customer_name,
        `${(Number(debt.cylinder_weight_grams) || 0) / 1000} kg`, debt.quantity,
        formatCurrency((Number(debt.balance_pesewas) || 0) / 100),
      ]),
    };
  }

  return {
    title: "GasFlow sales records",
    columns: ["Sale date", "Customer", "Cylinder", "Quantity", "Payment", "Location", "Total (GHS)"],
    rows: salesInRange.map((sale) => [
      recordDate(sale.sold_at), sale.customer_name || "Walk-in customer",
      `${(Number(sale.cylinder_weight_grams) || 0) / 1000} kg`, sale.quantity,
      paymentLabel(sale.payment_method), sale.delivery_location || "",
      formatCurrency((Number(sale.total_pesewas) || 0) / 100),
    ]),
  };
}

function ExportRecordsPage() {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 6);
  const [selectedReport, setSelectedReport] = useState("sales");
  const [format, setFormat] = useState("CSV");
  const [fromDate, setFromDate] = useState(dateInputValue(weekAgo));
  const [toDate, setToDate] = useState(dateInputValue(today));
  const [records, setRecords] = useState({ sales: [], debts: [] });
  const [exportStatus, setExportStatus] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const activeReport = reportOptions.find((report) => report.id === selectedReport);
  const isDateRangeValid = fromDate && toDate && fromDate <= toDate;

  const loadRecords = async () => {
    const [{ sales }, { debts }] = await Promise.all([api("/sales"), api("/debts")]);
    const nextRecords = { sales, debts };
    setRecords(nextRecords);
    return nextRecords;
  };

  useEffect(() => {
    loadRecords().catch(() => {});
  }, []);

  const reportPreview = useMemo(
    () => buildReport(selectedReport, records.sales, records.debts, fromDate, toDate),
    [fromDate, records, selectedReport, toDate],
  );
  const periodLabel = useMemo(() => {
    if (!isDateRangeValid) return "Choose a valid date range";
    const formatter = new Intl.DateTimeFormat("en-GH", { day: "numeric", month: "short", year: "numeric" });
    return `${formatter.format(new Date(`${fromDate}T00:00:00`))} – ${formatter.format(new Date(`${toDate}T00:00:00`))}`;
  }, [fromDate, isDateRangeValid, toDate]);

  const exportReport = async () => {
    if (!isDateRangeValid || isExporting) return;
    setIsExporting(true);
    setExportStatus("");
    try {
      const latestRecords = await loadRecords();
      const report = buildReport(selectedReport, latestRecords.sales, latestRecords.debts, fromDate, toDate);
      const baseName = `gasflow-${selectedReport}-${fromDate}-to-${toDate}`;
      let blob;
      let filename;
      if (format === "CSV") {
        const csv = [report.columns, ...report.rows].map((row) => row.map(escapeCsv).join(",")).join("\r\n");
        blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
        filename = `${baseName}.csv`;
      } else if (format === "Excel") {
        const tableRows = [report.columns, ...report.rows]
          .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
          .join("");
        blob = new Blob([`<html><head><meta charset="utf-8"></head><body><table>${tableRows}</table></body></html>`], { type: "application/vnd.ms-excel;charset=utf-8" });
        filename = `${baseName}.xls`;
      } else {
        blob = createPdf(report.title, periodLabel, report.columns, report.rows);
        filename = `${baseName}.pdf`;
      }
      downloadFile(blob, filename);
      setExportStatus(`Downloaded ${filename}`);
    } catch (error) {
      setExportStatus(error.message || "We could not prepare this export. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const countLabel = `${reportPreview.rows.length} record${reportPreview.rows.length === 1 ? "" : "s"}`;

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(280px,.75fr)]">
      <div className="space-y-5">
        <section className="rounded-2xl border border-[#e5eaed] bg-white p-5 shadow-[0_5px_18px_rgba(20,35,54,.035)] sm:p-6">
          <p className="text-[10px] font-bold tracking-[.12em] text-[#15925d]">BUILD A REPORT</p>
          <h3 className="mt-1 text-xl font-extrabold tracking-[-.045em] text-[#172132]">Choose the records to export</h3>
          <p className="mt-1 text-[11px] leading-relaxed text-[#718093]">Download a shareable copy for reconciliation, your accountant, or a station handover.</p>
          <div className="mt-5 grid gap-2">
            {reportOptions.map((report) => {
              const Icon = report.icon;
              const isSelected = report.id === selectedReport;
              return (
                <button key={report.id} type="button" onClick={() => { setSelectedReport(report.id); setExportStatus(""); }} className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition ${isSelected ? "border-[#15925d] bg-[#effaf4] ring-2 ring-[#15925d]/10" : "border-[#e1e7e9] hover:border-[#b8d8c5] hover:bg-[#f9fcfa]"}`}>
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${isSelected ? "bg-[#15925d] text-white" : "bg-[#f1f5f4] text-[#617084]"}`}><Icon size={18} /></span>
                  <span className="min-w-0 flex-1"><span className="block text-[12px] font-extrabold text-[#344052]">{report.label}</span><span className="mt-0.5 block text-[10px] text-[#718093]">{report.description}</span></span>
                  <span className={`hidden rounded-full px-2.5 py-1 text-[9px] font-bold sm:block ${isSelected ? "bg-white text-[#117d4f]" : "bg-[#f4f7f8] text-[#7a8796]"}`}>{isSelected ? countLabel : "Select"}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-[#e5eaed] bg-white p-5 shadow-[0_5px_18px_rgba(20,35,54,.035)] sm:p-6">
          <div className="flex items-center gap-2"><CalendarDays size={17} className="text-[#15925d]" /><div><p className="text-[10px] font-bold tracking-[.12em] text-[#15925d]">REPORT PERIOD</p><h3 className="mt-1 text-base font-extrabold text-[#172132]">Select a date range</h3></div></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label><span className="mb-1.5 block text-[10px] font-bold text-[#617084]">FROM</span><input type="date" value={fromDate} max={toDate || undefined} onChange={(event) => { setFromDate(event.target.value); setExportStatus(""); }} className="h-11 w-full rounded-xl border border-[#dbe3e7] bg-white px-3 text-[11px] font-bold text-[#344052] outline-none focus:border-[#15925d] focus:ring-4 focus:ring-[#15925d]/10" /></label>
            <label><span className="mb-1.5 block text-[10px] font-bold text-[#617084]">TO</span><input type="date" value={toDate} min={fromDate || undefined} max={dateInputValue(today)} onChange={(event) => { setToDate(event.target.value); setExportStatus(""); }} className="h-11 w-full rounded-xl border border-[#dbe3e7] bg-white px-3 text-[11px] font-bold text-[#344052] outline-none focus:border-[#15925d] focus:ring-4 focus:ring-[#15925d]/10" /></label>
          </div>
          {!isDateRangeValid && <p className="mt-2 text-[10px] font-bold text-[#b65039]">The end date must be on or after the start date.</p>}
          <div className="mt-5 border-t border-[#edf0f2] pt-4"><p className="text-[10px] font-bold tracking-[.1em] text-[#617084]">FILE FORMAT</p><div className="mt-2 flex flex-wrap gap-2">{["CSV", "Excel", "PDF"].map((item) => <button key={item} type="button" onClick={() => { setFormat(item); setExportStatus(""); }} className={`rounded-full px-4 py-2 text-[10px] font-bold transition ${format === item ? "bg-[#15925d] text-white shadow-[0_4px_10px_rgba(21,146,93,.2)]" : "bg-[#f1f5f4] text-[#617084] hover:bg-[#e4f3e9] hover:text-[#117d4f]"}`}>{item}</button>)}</div></div>
        </section>
      </div>

      <aside className="space-y-5">
        <section className="rounded-2xl bg-[#152438] p-5 text-white shadow-[0_8px_20px_rgba(20,35,54,.12)]">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/[.12] text-[#58d7a6]"><Download size={19} /></span>
          <p className="mt-4 text-[10px] font-bold tracking-[.12em] text-[#b7c5d2]">EXPORT READY</p>
          <h3 className="mt-1 text-lg font-extrabold tracking-[-.04em]">{activeReport.label}</h3>
          <p className="mt-1 text-[11px] leading-relaxed text-[#b7c5d2]">{periodLabel}</p>
          <div className="mt-5 rounded-xl bg-white/[.08] p-3"><div className="flex items-center justify-between text-[10px]"><span className="text-[#b7c5d2]">Selected format</span><span className="font-extrabold text-white">.{format === "Excel" ? "xls" : format.toLowerCase()}</span></div><div className="mt-2 flex items-center justify-between text-[10px]"><span className="text-[#b7c5d2]">Includes</span><span className="font-extrabold text-white">{countLabel}</span></div></div>
          <button type="button" disabled={!isDateRangeValid || isExporting} onClick={exportReport} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#15925d] px-4 py-3 text-[11px] font-extrabold text-white transition hover:bg-[#117d4f] disabled:cursor-not-allowed disabled:opacity-55"><Download size={16} /> {isExporting ? "Preparing download…" : `Export ${format} report`}</button>
          {exportStatus && <p role="status" className={`mt-3 flex items-center gap-1.5 text-[10px] font-bold ${exportStatus.startsWith("Downloaded") ? "text-[#6ce3b2]" : "text-[#ffbe85]"}`}><CheckCircle2 size={14} /> {exportStatus}</p>}
        </section>
        <section className="rounded-2xl border border-[#e7ecef] bg-white p-5 shadow-[0_5px_15px_rgba(20,35,54,.035)]"><h3 className="text-[12px] font-extrabold text-[#172132]">Before you export</h3><ul className="mt-3 space-y-2 text-[10px] leading-relaxed text-[#718093]"><li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#15925d]" />Exports use the records saved to this station.</li><li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#15925d]" />CSV works best for bookkeeping and Excel works for review.</li><li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#15925d]" />PDF gives you a fixed snapshot for sharing.</li></ul></section>
      </aside>
    </div>
  );
}

export default ExportRecordsPage;
