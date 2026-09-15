import { useEffect, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  UserRound,
} from "lucide-react";
import { api } from "../api";

function CustomerDebtsPage() {
  const today = new Date();
  const dateKey = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const [debts, setDebts] = useState([]);
  const [displayMonth, setDisplayMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(() => new Date(today));

  useEffect(() => {
    let cancelled = false;
    api("/debts")
      .then(({ debts: savedDebts }) => {
        if (!cancelled) setDebts(savedDebts);
      })
      .catch(() => {
        if (!cancelled) setDebts([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const debtByDate = debts.reduce((byDate, debt) => {
    const soldAt = String(debt.sold_at || "");
    const saleDate = new Date(soldAt.includes("T") ? soldAt : `${soldAt.replace(" ", "T")}Z`);
    const key = dateKey(saleDate);
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push({
      saleId: debt.sale_id,
      customer: debt.customer_name,
      cylinder: `${debt.cylinder_weight_grams / 1000} kg × ${debt.quantity}`,
      amount: (Number(debt.balance_pesewas) || 0) / 100,
    });
    return byDate;
  }, {});
  const daysInMonth = new Date(
    displayMonth.getFullYear(),
    displayMonth.getMonth() + 1,
    0,
  ).getDate();
  const monthDays = Array.from({ length: daysInMonth }, (_, index) => index + 1);
  const leadingEmptyDays = Array.from({
    length: new Date(
      displayMonth.getFullYear(),
      displayMonth.getMonth(),
      1,
    ).getDay(),
  });
  const selectedDebts = debtByDate[dateKey(selectedDate)] ?? [];
  const totalDebt = selectedDebts.reduce((total, debt) => total + debt.amount, 0);
  const monthTitle = new Intl.DateTimeFormat("en-GH", {
    month: "long",
    year: "numeric",
  }).format(displayMonth);
  const selectedDateLabel = new Intl.DateTimeFormat("en-GH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(selectedDate);
  const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-GH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

  const moveMonth = (direction) => {
    setDisplayMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + direction, 1),
    );
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[.9fr_1.4fr]">
      <section className="rounded-2xl border border-[#e5eaed] bg-white p-5 shadow-[0_5px_18px_rgba(20,35,54,.035)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-[.12em] text-[#15925d]">
              DEBT CALENDAR
            </p>
            <h3 className="mt-1 text-base font-extrabold text-[#172132]">
              {monthTitle}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => moveMonth(-1)}
              aria-label="Previous month"
              className="rounded-lg p-1.5 text-[#617084] transition hover:bg-[#f0f5f2]"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => moveMonth(1)}
              aria-label="Next month"
              className="rounded-lg p-1.5 text-[#617084] transition hover:bg-[#f0f5f2]"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-7 gap-1 text-center">
          {weekdays.map((day) => (
            <span key={day} className="py-1 text-[9px] font-bold text-[#8995a3]">
              {day}
            </span>
          ))}
          {leadingEmptyDays.map((_, index) => (
            <span key={`empty-${index}`} aria-hidden="true" />
          ))}
          {monthDays.map((day) => {
            const date = new Date(
              displayMonth.getFullYear(),
              displayMonth.getMonth(),
              day,
            );
            const hasDebt = Boolean(debtByDate[dateKey(date)]);
            const isSelected =
              selectedDate.getFullYear() === date.getFullYear() &&
              selectedDate.getMonth() === date.getMonth() &&
              selectedDate.getDate() === day;

            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDate(date)}
                aria-pressed={isSelected}
                aria-label={`View customer debts for ${new Intl.DateTimeFormat("en-GH", { day: "numeric", month: "long", year: "numeric" }).format(date)}${hasDebt ? ", debt recorded" : ", no debt recorded"}`}
                className={`relative grid h-9 place-items-center rounded-lg text-[10px] font-bold transition ${isSelected ? "bg-[#15925d] text-white shadow-[0_4px_9px_rgba(21,146,93,.22)]" : hasDebt ? "bg-[#fff6e6] text-[#9a6810] hover:bg-[#ffedc7]" : "text-[#7f8c9b] hover:bg-[#f3f6f5]"}`}
              >
                {day}
                {hasDebt && !isSelected && (
                  <span className="absolute bottom-1 h-1 w-1 rounded-full bg-[#c58b20]" />
                )}
              </button>
            );
          })}
        </div>
        <p className="mt-5 flex items-center gap-2 text-[10px] text-[#768394]">
          <span className="inline-block h-2 w-2 rounded-full bg-[#c58b20]" />
          Gold dates have customers with outstanding debt.
        </p>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#e5eaed] bg-white shadow-[0_5px_18px_rgba(20,35,54,.035)]">
        <div className="flex flex-col gap-3 border-b border-[#edf0f2] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-[.12em] text-[#15925d]">
              OUTSTANDING DEBTS
            </p>
            <h3 className="mt-1 text-base font-extrabold text-[#172132]">
              Customers owing on {selectedDateLabel}
            </h3>
          </div>
          <div className="rounded-xl bg-[#fff7e8] px-3 py-2 text-right">
            <p className="text-[9px] font-bold tracking-[.08em] text-[#9a6810]">TOTAL OWED</p>
            <p className="mt-0.5 text-sm font-extrabold text-[#73531c]">
              GH₵ {formatCurrency(totalDebt)}
            </p>
          </div>
        </div>
        {selectedDebts.length > 0 ? (
          <div className="divide-y divide-[#f0f2f4]">
            {selectedDebts.map((debt) => (
              <article key={debt.saleId} className="flex items-center gap-3 px-5 py-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#fff3d9] text-[#9a6810]">
                  <UserRound size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-extrabold text-[#344052]">
                    {debt.customer}
                  </p>
                  <p className="mt-0.5 text-[10px] text-[#778496]">
                    {debt.cylinder} cylinder on credit
                  </p>
                </div>
                <p className="text-right text-[12px] font-extrabold text-[#73531c]">
                  GH₵ {formatCurrency(debt.amount)}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="grid min-h-56 place-items-center px-5 text-center">
            <div>
              <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#effaf4] text-[#15925d]">
                <CircleDollarSign size={20} />
              </span>
              <p className="mt-3 text-[12px] font-extrabold text-[#344052]">
                No customer debts for this date
              </p>
              <p className="mt-1 text-[10px] text-[#778496]">
                Select a gold date to review its outstanding balances.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default CustomerDebtsPage;
