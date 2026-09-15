import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { api } from "../api";

function MonthlyAnalyticsPage() {
  const today = new Date();
  const initialMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [sales, setSales] = useState([]);

  useEffect(() => {
    let cancelled = false;
    api("/sales")
      .then(({ sales: savedSales }) => {
        if (!cancelled) setSales(savedSales);
      })
      .catch(() => {
        if (!cancelled) setSales([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const monthlyOverview = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const monthDate = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const monthLabel = new Intl.DateTimeFormat("en-GH", {
      month: "long",
      year: "numeric",
    }).format(monthDate);
    const shortMonth = new Intl.DateTimeFormat("en-GH", {
      month: "short",
    }).format(monthDate);
    const weeklySales = Array.from({ length: 4 }, (_, index) => {
      const firstDay = index * 7 + 1;
      const lastDay = index === 3 ? daysInMonth : Math.min(daysInMonth, firstDay + 6);
      return {
        label: `Week ${index + 1}`,
        period: `${firstDay}–${lastDay} ${shortMonth}`,
        sales: 0,
      };
    });
    for (const sale of sales) {
      const saleDate = new Date(sale.sold_at);
      if (saleDate.getFullYear() !== year || saleDate.getMonth() !== month - 1) continue;
      const weekIndex = Math.min(3, Math.floor((saleDate.getDate() - 1) / 7));
      weeklySales[weekIndex].sales += (Number(sale.total_pesewas) || 0) / 100;
    }
    const monthlySales = weeklySales.reduce((total, week) => total + week.sales, 0);

    return { monthDate, monthLabel, weeklySales, monthlySales };
  }, [sales, selectedMonth]);

  const highestWeeklySales = Math.max(...monthlyOverview.weeklySales.map((week) => week.sales));
  const chartMaximum = Math.max(1, highestWeeklySales);
  const bestWeek = highestWeeklySales > 0
    ? monthlyOverview.weeklySales.find((week) => week.sales === highestWeeklySales)
    : null;
  const averageWeeklySales =
    monthlyOverview.monthlySales / monthlyOverview.weeklySales.length;
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-GH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

  const moveMonth = (amount) => {
    const nextMonth = new Date(
      monthlyOverview.monthDate.getFullYear(),
      monthlyOverview.monthDate.getMonth() + amount,
      1,
    );
    setSelectedMonth(
      `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}`,
    );
  };

  return (
    <div>
      <section className="rounded-2xl border border-[#e5eaed] bg-white p-5 shadow-[0_5px_18px_rgba(20,35,54,.035)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-[.12em] text-[#15925d]">
              MONTHLY SALES OVERVIEW
            </p>
            <h3 className="mt-1 text-xl font-extrabold tracking-[-.045em] text-[#172132]">
              {monthlyOverview.monthLabel}
            </h3>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-[#dbe3e7] bg-[#f8faf9] p-1.5">
            <button
              type="button"
              onClick={() => moveMonth(-1)}
              aria-label="Previous month"
              className="rounded-lg p-2 text-[#617084] transition hover:bg-white hover:text-[#117d4f]"
            >
              <ChevronLeft size={17} />
            </button>
            <label className="relative flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 shadow-sm">
              <CalendarDays size={15} className="text-[#15925d]" />
              <span className="sr-only">Select month</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(event) => {
                  if (event.target.value) setSelectedMonth(event.target.value);
                }}
                className="bg-transparent text-[11px] font-bold text-[#344052] outline-none"
              />
            </label>
            <button
              type="button"
              onClick={() => moveMonth(1)}
              aria-label="Next month"
              className="rounded-lg p-2 text-[#617084] transition hover:bg-white hover:text-[#117d4f]"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl bg-[#152438] p-4 text-white shadow-[0_8px_20px_rgba(20,35,54,.12)]">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/[.12] text-[#56d7a4]">
            <TrendingUp size={17} />
          </span>
          <p className="mt-3 text-2xl font-extrabold tracking-[-.055em]">
            GH₵ {formatCurrency(monthlyOverview.monthlySales)}
          </p>
          <p className="mt-1 text-[10px] font-bold text-[#b7c5d2]">
            Monthly sales total
          </p>
        </article>
        <article className="rounded-2xl border border-[#e7ecef] bg-white p-4 shadow-[0_5px_15px_rgba(20,35,54,.035)]">
          <span className="inline-flex rounded-lg bg-[#eaf8f0] px-2 py-1 text-[9px] font-bold text-[#15925d]">
            WEEKLY AVERAGE
          </span>
          <p className="mt-3 text-2xl font-extrabold tracking-[-.055em] text-[#172132]">
            GH₵ {formatCurrency(averageWeeklySales)}
          </p>
          <p className="mt-1 text-[10px] text-[#778496]">
            Across {monthlyOverview.weeklySales.length} weeks
          </p>
        </article>
        <article className="rounded-2xl border border-[#e7ecef] bg-white p-4 shadow-[0_5px_15px_rgba(20,35,54,.035)]">
          <span className="inline-flex rounded-lg bg-[#fff7e8] px-2 py-1 text-[9px] font-bold text-[#bd7a12]">
            BEST WEEK
          </span>
          <p className="mt-3 text-2xl font-extrabold tracking-[-.055em] text-[#172132]">
            GH₵ {formatCurrency(highestWeeklySales)}
          </p>
          <p className="mt-1 text-[10px] text-[#778496]">
            {bestWeek ? `${bestWeek.label} · ${bestWeek.period}` : "No sales yet"}
          </p>
        </article>
      </div>

      <section className="mt-5 overflow-hidden rounded-2xl border border-[#e5eaed] bg-white shadow-[0_5px_18px_rgba(20,35,54,.035)]">
        <div className="flex items-center justify-between border-b border-[#edf0f2] px-5 py-4">
          <div>
            <p className="text-[10px] font-bold tracking-[.12em] text-[#15925d]">
              WEEKLY SALES
            </p>
            <h3 className="mt-1 text-base font-extrabold text-[#172132]">
              Sales for {monthlyOverview.monthLabel}
            </h3>
          </div>
          <span className="text-[10px] font-bold text-[#718093]">
            GH₵ {formatCurrency(monthlyOverview.monthlySales)} total
          </span>
        </div>
        <div className="grid gap-6 p-5 pt-8 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
          <div
            className="grid gap-3 sm:gap-5"
            style={{
              gridTemplateColumns: `repeat(${monthlyOverview.weeklySales.length}, minmax(0, 1fr))`,
            }}
          >
            {monthlyOverview.weeklySales.map((week) => (
              <div key={week.label} className="min-w-0">
                <div className="flex h-32 items-end border-b border-[#dce6e1] px-1 sm:px-2">
                  <div
                    className="relative mx-auto w-8 rounded-t-md bg-[#15925d] shadow-[0_-3px_10px_rgba(21,146,93,.16)] transition-all hover:bg-[#117d4f] sm:w-10"
                    style={{
                      height: `${Math.max((week.sales / chartMaximum) * 100, 12)}%`,
                    }}
                    title={`${week.label}: GH₵ ${formatCurrency(week.sales)}`}
                  >
                    <span className="absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap text-[8px] font-extrabold text-[#344052]">
                      GH₵ {formatCurrency(week.sales)}
                    </span>
                  </div>
                </div>
                <p className="mt-2.5 text-center text-[10px] font-extrabold text-[#344052]">
                  {week.label}
                </p>
                <p className="mt-0.5 text-center text-[8px] text-[#7d8999] sm:text-[9px]">
                  {week.period}
                </p>
              </div>
            ))}
          </div>
          <aside className="rounded-2xl bg-[#f3faf6] p-5 lg:min-h-[190px] lg:flex lg:flex-col lg:justify-center">
            <p className="text-[10px] font-bold tracking-[.1em] text-[#15925d]">
              MONTHLY SALES TOTAL
            </p>
            <p className="mt-2 text-2xl font-extrabold tracking-[-.05em] text-[#117d4f]">
              GH₵ {formatCurrency(monthlyOverview.monthlySales)}
            </p>
            <p className="mt-2 text-[10px] leading-relaxed text-[#68788a]">
              Total sales across all four weeks in {monthlyOverview.monthLabel}.
            </p>
          </aside>
        </div>
      </section>
    </div>
  );
}

export default MonthlyAnalyticsPage;
