import { useEffect, useState } from "react";
import { api, authApi } from "./api";
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  CloudOff,
  Download,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  MapPin,
  Menu,
  MoreHorizontal,
  Moon,
  Pencil,
  PlusCircle,
  Settings2,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import CustomerDebtsPage from "./pages/CustomerDebtsPage";
import DashboardPage from "./pages/DashboardPage";
import ExportRecordsPage from "./pages/ExportRecordsPage";
import GasRateSettingsPage from "./pages/GasRateSettingsPage";
import MonthlyAnalyticsPage from "./pages/MonthlyAnalyticsPage";
import RecordSalePage from "./pages/RecordSalePage";
import TodaySummaryPage from "./pages/TodaySummaryPage";

const primaryItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "record-sale", label: "Record Sale (POS)", mobileLabel: "Record sale", icon: PlusCircle },
  { id: "today", label: "Today's Summary", mobileLabel: "Today", icon: CalendarDays },
  { id: "analytics", label: "Monthly Analytics", icon: BarChart3 },
  { id: "debts", label: "Customer Debts / Credit", mobileLabel: "Debts", icon: CircleDollarSign },
];

const utilityItems = [
  { id: "rate", label: "Gas Rate Settings", icon: Settings2 },
  { id: "export", label: "Export Records", icon: Download },
];

const cylinderSizeOptions = [
  "3 kg",
  "5 kg",
  "7 kg",
  "10 kg",
  "13 kg",
  "14.5 kg",
  "19 kg",
  "25 kg",
  "30 kg",
  "35 kg",
  "40 kg",
  "52 kg",
  "55 kg",
  "60 kg",
];

const pageCopy = {
  dashboard: {
    eyebrow: "TODAY'S SALES OVERVIEW",
    title: "Dashboard",
    description:
      "See how today's cylinder sales, payments, and deliveries are performing.",
  },
  today: {
    eyebrow: "LIVE RECONCILIATION",
    title: "Today's Summary",
    description:
      "Keep an eye on payments, deliveries, and your shift balance in real time.",
  },
  analytics: {
    eyebrow: "PERFORMANCE OVERVIEW",
    title: "Monthly Analytics",
    description:
      "Review revenue, delivered volume, and station growth at a glance.",
  },
  debts: {
    eyebrow: "CREDIT TRACKER",
    title: "Customer Debts / Credit",
    description: "Follow unpaid refills and outstanding customer balances.",
  },
  rate: {
    eyebrow: "PRICING CONTROL",
    title: "Gas Rate Settings",
    description: "Update the active pump rate used across your sales entries.",
  },
  export: {
    eyebrow: "REPORTING",
    title: "Export Records",
    description: "Prepare a clean CSV, Excel, or PDF report for your books.",
  },
};

const pageComponents = {
  dashboard: DashboardPage,
  "record-sale": RecordSalePage,
  today: TodaySummaryPage,
  analytics: MonthlyAnalyticsPage,
  debts: CustomerDebtsPage,
  rate: GasRateSettingsPage,
  export: ExportRecordsPage,
};

function NavItem({ item, active, onSelect, compact = false, collapsed = false }) {
  const Icon = item.icon;
  const selected = active === item.id;
  const desktopStyle = selected
    ? "bg-[#e8f6ee] text-[#117d4f]"
    : "text-[#667587] hover:bg-[#f2f6f4] hover:text-[#117d4f]";
  const compactStyle = selected
    ? "bg-[#e8f6ee] text-[#117d4f]"
    : "text-[#667587] hover:bg-[#f2f6f4] hover:text-[#117d4f]";

  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      aria-current={selected ? "page" : undefined}
      aria-label={collapsed ? item.label : undefined}
      title={collapsed ? item.label : undefined}
      className={`group flex w-full items-center gap-3 px-3 py-2.5 text-left text-[12px] font-semibold transition-all duration-200 ease-out ${compact ? `flex-col gap-1 rounded-xl px-2 py-2 text-[9px] ${compactStyle}` : `min-h-11 rounded-full ${collapsed ? "justify-center px-2" : ""} ${desktopStyle}`}`}
    >
      <Icon
        size={compact ? 19 : 17}
        strokeWidth={selected ? 2.5 : 2}
        className={`shrink-0 transition-colors duration-200 ${!compact && selected ? "text-[#c8a63a]" : ""}`}
      />
      <span className={collapsed ? "sr-only" : ""}>{item.label}</span>
    </button>
  );
}

function MobileNavItem({ item, active, onSelect }) {
  const Icon = item.icon;
  const selected = active === item.id;

  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      aria-current={selected ? "page" : undefined}
      className={`group flex h-[58px] min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-2 text-[10px] font-bold transition-all duration-200 ${selected ? "bg-[#edf7f1] text-[#117d4f] shadow-[0_4px_12px_rgba(21,146,93,.09)]" : "text-[#718093] active:scale-95"}`}
    >
      <span className={`grid h-7 w-7 place-items-center rounded-xl transition ${selected ? "bg-[#15925d] text-white shadow-[0_4px_9px_rgba(21,146,93,.22)]" : "text-[#718093] group-hover:bg-[#f1f5f3] group-hover:text-[#117d4f]"}`}>
        <Icon size={17} strokeWidth={selected ? 2.6 : 2.15} />
      </span>
      <span className="max-w-full truncate leading-none">{item.mobileLabel || item.label}</span>
    </button>
  );
}

function SidebarContent({
  active,
  onSelect,
  onLogout,
  isDrawer = false,
  collapsed = false,
  onToggleCollapse,
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-r-[28px] border-r border-[#e5eaed] bg-white">
      <div className={`${collapsed ? "px-3 pb-3 pt-4" : "px-5 pb-4 pt-5"} text-center`}>
        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} text-left`}>
          <img
            src="/assets/gasflow-logo-primary.png"
            alt="GasFlow"
            className="h-9 w-9 rounded-xl shadow-sm"
          />
          {!isDrawer && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="grid h-8 w-8 place-items-center rounded-lg text-[#667587] transition hover:bg-[#f2f6f4] hover:text-[#117d4f]"
            >
              {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
            </button>
          )}
        </div>
      </div>

      <nav
        aria-label="Main navigation"
        className={`${collapsed ? "mx-2 px-1" : "mx-3 px-1"} flex-1 overflow-y-auto border-t border-[#e5eaed] py-5`}
      >
        {!collapsed && <p className="px-3 text-[9px] font-bold tracking-[.14em] text-[#8490a0]">WORKSPACE</p>}
        <div className="mt-3 space-y-1.5">
          {primaryItems.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              active={active}
              onSelect={onSelect}
              collapsed={collapsed}
            />
          ))}
        </div>
        <div className="mt-4 border-t border-[#e5eaed] pt-4">{!collapsed && <p className="px-3 text-[9px] font-bold tracking-[.14em] text-[#8490a0]">TOOLS</p>}</div>
        <div className="mt-3 space-y-1.5">
          {utilityItems.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              active={active}
              onSelect={onSelect}
              collapsed={collapsed}
            />
          ))}
        </div>
      </nav>

      <button
        type="button"
        onClick={onLogout}
        aria-label="Log out"
        title="Log out"
        className={`${collapsed ? "mx-2 justify-center" : "mx-4 gap-2"} mb-4 flex w-auto items-center rounded-2xl bg-[#fff0f0] p-3 text-[10px] font-bold text-[#c24141] transition hover:bg-[#ffe1e1] hover:text-[#a92f2f]`}
      >
        <LogOut size={16} strokeWidth={2.5} />
        {!collapsed && <span>Logout</span>}
      </button>
    </div>
  );
}

function StatCard({ label, value, note, tone = "green" }) {
  const tones = {
    green: "bg-[#eaf8f0] text-[#15925d]",
    navy: "bg-[#edf1f6] text-[#26354b]",
    gold: "bg-[#fff7e8] text-[#bd7a12]",
  };
  return (
    <article className="rounded-2xl border border-[#e7ecef] bg-white p-4 shadow-[0_5px_15px_rgba(20,35,54,.035)]">
      <span
        className={`inline-flex rounded-lg px-2 py-1 text-[9px] font-bold ${tones[tone]}`}
      >
        {label}
      </span>
      <p className="mt-3 text-2xl font-extrabold tracking-[-.055em] text-[#172132]">
        {value}
      </p>
      <p className="mt-1 text-[10px] text-[#778496]">{note}</p>
    </article>
  );
}

const formatMoney = (pesewas) =>
  new Intl.NumberFormat("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format((Number(pesewas) || 0) / 100);

function SalesDashboard({ refreshKey = 0 }) {
  const today = new Date();
  const [displayMonth, setDisplayMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(() => new Date());
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
  }, [refreshKey]);

  const salesByDay = sales.reduce((days, sale) => {
    const saleDate = new Date(sale.sold_at);
    const key = `${saleDate.getFullYear()}-${saleDate.getMonth()}-${saleDate.getDate()}`;
    if (!days[key]) {
      days[key] = {
        total: 0,
        momo: 0,
        cash: 0,
        kg: 0,
        sales: [],
      };
    }
    const day = days[key];
    day.total += Number(sale.total_pesewas) || 0;
    day.momo += Number(sale.mobile_money_paid_pesewas) || 0;
    day.cash += Number(sale.cash_paid_pesewas) || 0;
    day.kg += ((Number(sale.cylinder_weight_grams) || 0) / 1000) * (Number(sale.quantity) || 0);
    day.sales.push(sale);
    return days;
  }, {});
  const selectedSales = salesByDay[
    `${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${selectedDate.getDate()}`
  ] ?? {
    total: 0,
    momo: 0,
    cash: 0,
    kg: 0,
    sales: [],
  };
  const momoPercentage =
    selectedSales.total === 0
      ? 0
      : Math.round(
          (selectedSales.momo / selectedSales.total) * 100,
        );
  const cashPercentage = selectedSales.total === 0 ? 0 : Math.round((selectedSales.cash / selectedSales.total) * 100);
  const daysInMonth = new Date(
    displayMonth.getFullYear(),
    displayMonth.getMonth() + 1,
    0,
  ).getDate();
  const monthDays = Array.from(
    { length: daysInMonth },
    (_, index) => index + 1,
  );
  const leadingEmptyDays = Array.from({
    length: new Date(
      displayMonth.getFullYear(),
      displayMonth.getMonth(),
      1,
    ).getDay(),
  });
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

  const moveMonth = (direction) => {
    setDisplayMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + direction, 1),
    );
  };

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="TOTAL SALES"
          value={`GH₵ ${formatMoney(selectedSales.total)}`}
          note={`Sales on ${selectedDateLabel}`}
        />
        <StatCard
          label="MOMO RECEIVED"
          value={`GH₵ ${formatMoney(selectedSales.momo)}`}
          note={`${momoPercentage}% of selected-day payments`}
          tone="navy"
        />
        <StatCard
          label="KG DELIVERED"
          value={`${selectedSales.kg.toLocaleString("en-GH", { maximumFractionDigits: 2 })} kg`}
          note={`Delivered on ${selectedDateLabel}`}
          tone="gold"
        />
      </div>
      <div className="mt-6 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <section className="overflow-hidden rounded-2xl border border-[#e5eaed] bg-white shadow-[0_5px_18px_rgba(20,35,54,.035)]">
          <div className="flex items-center justify-between border-b border-[#edf0f2] px-5 py-4">
            <div>
              <p className="text-[10px] font-bold tracking-[.12em] text-[#15925d]">
                LIVE SALES LOG
              </p>
              <h3 className="mt-1 text-base font-extrabold">
                Sales on {selectedDateLabel}
              </h3>
            </div>
            <button
              type="button"
              className="text-[10px] font-bold text-[#15925d] hover:text-[#117d4f]"
            >
              View all records
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left">
              <thead className="bg-[#f8fafb] text-[9px] font-bold tracking-[.08em] text-[#8490a0]">
                <tr>
                  <th className="px-5 py-3">CUSTOMER</th>
                  <th className="px-3 py-3">SALE</th>
                  <th className="px-3 py-3">PAYMENT</th>
                  <th className="px-5 py-3 text-right">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {selectedSales.sales.map((sale) => (
                  <tr
                    key={sale.id}
                    className="border-t border-[#f0f2f4] text-[11px]"
                  >
                    <td className="px-5 py-3.5 font-bold text-[#344052]">
                      {sale.customer_name || "Walk-in customer"}
                    </td>
                    <td className="px-3 py-3.5 text-[#708093]">
                      {`${sale.cylinder_weight_grams / 1000} kg × ${sale.quantity}`}
                    </td>
                    <td className="px-3 py-3.5">
                      <span
                        className={`rounded-full px-2 py-1 text-[9px] font-bold ${sale.payment_method === "mobile_money" ? "bg-[#eaf8f0] text-[#15925d]" : "bg-[#f2f4f6] text-[#657286]"}`}
                      >
                        {sale.payment_method === "mobile_money" ? "MoMo" : sale.payment_method === "credit" ? "Credit" : "Cash"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-extrabold text-[#172132]">
                      GH₵ {formatMoney(sale.total_pesewas)}
                    </td>
                  </tr>
                ))}
                {selectedSales.sales.length === 0 && (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-5 py-10 text-center text-[11px] text-[#8290a0]"
                    >
                      No sales were recorded on this date.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
        <div className="space-y-5">
          <section className="rounded-2xl border border-[#e5eaed] bg-white p-5 shadow-[0_5px_18px_rgba(20,35,54,.035)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold tracking-[.12em] text-[#15925d]">
                  SALES CALENDAR
                </p>
                <h3 className="mt-1 text-base font-extrabold">{monthTitle}</h3>
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
            <div className="mt-4 grid grid-cols-7 gap-1 text-center">
              {weekdays.map((day) => (
                <span
                  key={day}
                  className="py-1 text-[9px] font-bold text-[#8995a3]"
                >
                  {day}
                </span>
              ))}
              {leadingEmptyDays.map((_, index) => (
                <span key={`empty-${index}`} aria-hidden="true" />
              ))}
              {monthDays.map((day) => {
                const hasSales =
                  Boolean(salesByDay[`${displayMonth.getFullYear()}-${displayMonth.getMonth()}-${day}`]);
                const isSelected =
                  selectedDate.getFullYear() === displayMonth.getFullYear() &&
                  selectedDate.getMonth() === displayMonth.getMonth() &&
                  selectedDate.getDate() === day;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() =>
                      setSelectedDate(
                        new Date(
                          displayMonth.getFullYear(),
                          displayMonth.getMonth(),
                          day,
                        ),
                      )
                    }
                    aria-pressed={isSelected}
                    aria-label={`View sales for ${new Intl.DateTimeFormat("en-GH", { day: "numeric", month: "long", year: "numeric" }).format(new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day))}${hasSales ? ", sales recorded" : ", no sales recorded"}`}
                    className={`relative grid h-8 place-items-center rounded-lg text-[10px] font-bold transition ${isSelected ? "bg-[#15925d] text-white shadow-[0_4px_9px_rgba(21,146,93,.22)]" : hasSales ? "bg-[#effaf4] text-[#117d4f] hover:bg-[#dff5e9]" : "text-[#7f8c9b] hover:bg-[#f3f6f5]"}`}
                  >
                    {day}
                    {hasSales && !isSelected && (
                      <span className="absolute bottom-1 h-1 w-1 rounded-full bg-[#15925d]" />
                    )}
                  </button>
                );
              })}
            </div>
            <p className="mt-4 text-[10px] text-[#768394]">
              <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#15925d]" />
              Green dates have recorded sales. Select a date to review it.
            </p>
          </section>
          <section className="rounded-2xl bg-[#152438] p-5 text-white shadow-[0_10px_25px_rgba(20,35,54,.12)]">
            <p className="text-[10px] font-bold tracking-[.12em] text-[#56d7a4]">
              PAYMENT RECONCILIATION
            </p>
            <h3 className="mt-1 text-base font-extrabold">
              {selectedDateLabel} collection
            </h3>
            <div className="mt-6 space-y-4">
              <div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#b7c5d2]">Mobile Money</span>
                  <b>GH₵ {formatMoney(selectedSales.momo)}</b>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[.10]">
                  <div
                    className="h-full rounded-full bg-[#36ca8b]"
                    style={{ width: `${momoPercentage}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#b7c5d2]">Cash in hand</span>
                  <b>GH₵ {formatMoney(selectedSales.cash)}</b>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[.10]">
                  <div
                    className="h-full rounded-full bg-[#93a6b8]"
                    style={{ width: `${cashPercentage}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="mt-7 border-t border-white/[.1] pt-4">
              <p className="text-[10px] text-[#9eb0bf]">
                Expected shift balance
              </p>
              <p className="mt-1 text-xl font-extrabold">
                GH₵ {formatMoney(selectedSales.total)}
              </p>
              <p className="mt-1 text-[9px] font-bold text-[#56d7a4]">
                ● All sales reconciled
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

function RecordSaleForm({ rate, onEditRate, onSaleRecorded }) {
  const [cylinderSize, setCylinderSize] = useState("13 kg");
  const [manualCylinderSize, setManualCylinderSize] = useState("");
  const [isCylinderPickerOpen, setIsCylinderPickerOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Mobile Money");
  const [creditAmount, setCreditAmount] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const isManualCylinderSize = cylinderSize === "manual";
  const selectedCylinderSize = isManualCylinderSize
    ? manualCylinderSize
    : cylinderSize;
  const cylinderWeight = Number.parseFloat(selectedCylinderSize);
  const ratePerKg = Number.parseFloat(rate);
  const quantityValue = Number(quantity);
  const hasValidQuantity = Number.isInteger(quantityValue) && quantityValue > 0;
  const saleAmount =
    Number.isFinite(cylinderWeight) &&
    Number.isFinite(ratePerKg) &&
    hasValidQuantity
      ? cylinderWeight * ratePerKg * quantityValue
    : null;
  const isCreditSale = paymentMethod === "Credit / Debt";
  const enteredCreditAmount = Number.parseFloat(creditAmount);
  const hasValidCreditAmount = !isCreditSale || (
    saleAmount !== null &&
    Number.isFinite(enteredCreditAmount) &&
    enteredCreditAmount > 0 &&
    enteredCreditAmount <= saleAmount
  );
  const totalAmount = saleAmount;

  const submitSale = async (event) => {
    event.preventDefault();
    if (totalAmount === null || !hasValidCreditAmount || saving) return;
    const form = event.currentTarget;
    const formData = new FormData(form);
    setSaving(true);
    setNotice("");
    try {
      const amountPaidPesewas = isCreditSale
        ? Math.round((saleAmount - enteredCreditAmount) * 100)
        : Math.round(saleAmount * 100);
      await api("/sales", {
        method: "POST",
        body: JSON.stringify({
          customerName: formData.get("customerName"),
          deliveryLocation: formData.get("location"),
          cylinderWeightGrams: Math.round(cylinderWeight * 1000),
          quantity: quantityValue,
          paymentMethod,
          amountPaidPesewas,
        }),
      });
      form.reset();
      setPaymentMethod("Mobile Money");
      setCreditAmount("");
      setNotice("Sale saved to the database and added to your dashboard.");
      onSaleRecorded?.();
    } catch (error) {
      setNotice(error.message || "We could not save this sale. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const selectCylinderSize = (size) => {
    setCylinderSize(size);
    setIsCylinderPickerOpen(false);
    setNotice("");
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-[#dce9e2] bg-white shadow-[0_10px_30px_rgba(20,70,46,.06)]">
      <div className="flex flex-col gap-3 border-b border-[#e8eeeb] bg-[#f3faf6] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-bold tracking-[.12em] text-[#15925d]">
            SALES ENTRY
          </p>
          <h2 className="mt-1 text-lg font-extrabold tracking-[-.045em] text-[#172132]">
            Record a cylinder refill
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onEditRate}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#bce6cf] bg-white px-3 py-1.5 text-[10px] font-bold text-[#117d4f] shadow-sm transition hover:bg-[#effaf4]"
            aria-label="Edit active gas rate"
          >
            GH₵ {rate}/kg <Pencil size={12} />
          </button>
        </div>
      </div>
      <form onSubmit={submitSale} className="p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-[#455267]">
              <UserRound size={14} className="text-[#15925d]" /> Customer name
            </span>
            <input
              required
              name="customerName"
              placeholder="Enter customer's full name"
              className="h-11 w-full rounded-xl border border-[#dbe3e7] bg-white px-3 text-[12px] font-medium outline-none transition placeholder:text-[#a1acb7] focus:border-[#15925d] focus:ring-4 focus:ring-[#15925d]/10"
            />
          </label>
          <div className="block">
            <span className="mb-1.5 block text-[11px] font-bold text-[#455267]">
              Cylinder size
            </span>
            <div className="relative">
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={isCylinderPickerOpen}
                onClick={() => setIsCylinderPickerOpen((open) => !open)}
                className="flex h-12 w-full items-center justify-between rounded-xl border border-[#cde4d7] bg-[#f7fcf9] px-3.5 text-left shadow-sm outline-none transition hover:border-[#8dccaa] focus:border-[#15925d] focus:ring-4 focus:ring-[#15925d]/10"
              >
                <span>
                  <span className="block text-[9px] font-bold tracking-[.1em] text-[#728276]">
                    {isManualCylinderSize ? "CUSTOM SIZE" : "PRESET SIZE"}
                  </span>
                  <span className="mt-0.5 block text-[13px] font-extrabold text-[#172132]">
                    {isManualCylinderSize
                      ? manualCylinderSize
                        ? `${manualCylinderSize} kg`
                        : "Enter a size"
                      : cylinderSize}
                  </span>
                </span>
                <ChevronDown
                  size={18}
                  className={`text-[#15925d] transition ${isCylinderPickerOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isCylinderPickerOpen && (
                <div
                  role="listbox"
                  aria-label="Cylinder sizes"
                  className="absolute z-10 mt-2 w-full rounded-2xl border border-[#cde4d7] bg-white p-2.5 shadow-[0_16px_30px_rgba(20,70,46,.14)]"
                >
                  <p className="px-1 pb-2 text-[9px] font-bold tracking-[.12em] text-[#718093]">
                    CHOOSE A PRESET SIZE
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {cylinderSizeOptions.map((size) => {
                      const isSelected = cylinderSize === size;
                      return (
                        <button
                          key={size}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => selectCylinderSize(size)}
                          className={`rounded-lg px-2 py-2 text-[11px] font-bold transition ${isSelected ? "bg-[#15925d] text-white shadow-sm" : "bg-[#f5f8f6] text-[#425064] hover:bg-[#e8f6ee] hover:text-[#117d4f]"}`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isManualCylinderSize}
                    onClick={() => selectCylinderSize("manual")}
                    className={`mt-2 flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-[10px] font-bold transition ${isManualCylinderSize ? "border-[#15925d] bg-[#effaf4] text-[#117d4f]" : "border-dashed border-[#b8d8c5] text-[#536176] hover:border-[#15925d] hover:bg-[#f7fcf9]"}`}
                  >
                    <span>Enter a custom cylinder size</span>
                    <span className="text-base leading-none">+</span>
                  </button>
                </div>
              )}
            </div>
            {isManualCylinderSize && (
              <input
                required
                type="number"
                min="0.1"
                step="0.1"
                value={manualCylinderSize}
                onChange={(event) => {
                  setManualCylinderSize(event.target.value);
                  setNotice("");
                }}
                placeholder="Enter cylinder size in kg"
                aria-label="Manual cylinder size in kilograms"
                className="mt-2 h-11 w-full rounded-xl border border-[#dbe3e7] bg-white px-3 text-[12px] font-medium outline-none transition placeholder:text-[#a1acb7] focus:border-[#15925d] focus:ring-4 focus:ring-[#15925d]/10"
              />
            )}
          </div>
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-[#455267]">
              <MapPin size={14} className="text-[#15925d]" /> Delivery location
            </span>
            <input
              required
              name="location"
              placeholder="e.g. Community 25, Tema"
              className="h-11 w-full rounded-xl border border-[#dbe3e7] bg-white px-3 text-[12px] font-medium outline-none transition placeholder:text-[#a1acb7] focus:border-[#15925d] focus:ring-4 focus:ring-[#15925d]/10"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold text-[#455267]">
              Quantity
            </span>
            <div className="flex h-12 overflow-hidden rounded-xl border border-[#dbe3e7] bg-white shadow-sm focus-within:border-[#15925d] focus-within:ring-4 focus-within:ring-[#15925d]/10">
              <button
                type="button"
                onClick={() => {
                  setQuantity((current) =>
                    String(Math.max(1, (Number(current) || 1) - 1)),
                  );
                  setNotice("");
                }}
                aria-label="Decrease quantity"
                disabled={Number(quantity) <= 1}
                className="w-12 border-r border-[#e8eeeb] text-lg font-medium text-[#536176] transition hover:bg-[#f3faf6] hover:text-[#117d4f] disabled:cursor-not-allowed disabled:text-[#c2cad1] disabled:hover:bg-white"
              >
                −
              </button>
              <input
                required
                name="quantity"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={quantity}
                onChange={(event) => {
                  setQuantity(event.target.value);
                  setNotice("");
                }}
                aria-label="Cylinder quantity"
                className="min-w-0 flex-1 text-center text-[13px] font-extrabold text-[#172132] outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  setQuantity((current) => String((Number(current) || 0) + 1));
                  setNotice("");
                }}
                aria-label="Increase quantity"
                className="w-12 border-l border-[#e8eeeb] text-lg font-medium text-[#536176] transition hover:bg-[#f3faf6] hover:text-[#117d4f]"
              >
                +
              </button>
            </div>
          </label>
        </div>
        <fieldset className="mt-5">
          <legend className="text-[11px] font-bold text-[#455267]">
            Mode of payment
          </legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {["Mobile Money", "Cash", "Credit / Debt"].map((method) => (
              <label
                key={method}
                className={`flex cursor-pointer items-center justify-between rounded-xl border px-3.5 py-3 text-[11px] font-bold transition ${paymentMethod === method ? "border-[#15925d] bg-[#effaf4] text-[#117d4f] ring-2 ring-[#15925d]/10" : "border-[#dbe3e7] text-[#536176] hover:border-[#a8d7be]"}`}
              >
                <span>{method}</span>
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method}
                  checked={paymentMethod === method}
                  onChange={() => {
                    setPaymentMethod(method);
                    setNotice("");
                  }}
                  className="h-3.5 w-3.5 accent-[#15925d]"
                />
              </label>
            ))}
          </div>
        </fieldset>
        {isCreditSale && (
          <label className="mt-4 block rounded-xl border border-[#f0d9af] bg-[#fffaf0] p-3.5">
            <span className="flex items-center justify-between gap-3 text-[11px] font-bold text-[#73531c]">
              Amount on credit (GH₵)
              <span className="rounded-full bg-[#fff0cc] px-2 py-0.5 text-[9px] tracking-[.08em] text-[#9a6810]">
                MANUAL ENTRY
              </span>
            </span>
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              value={creditAmount}
              onChange={(event) => {
                setCreditAmount(event.target.value);
                setNotice("");
              }}
              placeholder={
                saleAmount === null
                  ? "Enter the amount owed"
                  : `e.g. ${saleAmount.toFixed(2)}`
              }
              aria-label="Amount on credit in Ghana cedis"
              className="mt-2 h-11 w-full rounded-lg border border-[#ecd4a4] bg-white px-3 text-[13px] font-extrabold text-[#172132] outline-none transition placeholder:font-medium placeholder:text-[#b39b71] focus:border-[#c58b20] focus:ring-4 focus:ring-[#c58b20]/10"
            />
            <span className="mt-1.5 block text-[9px] text-[#8d7040]">
              Enter the amount the customer will owe for this sale.
            </span>
          </label>
        )}
        <div className="mt-6 border-t border-[#e9eeeb] pt-5">
          <div>
            <p className="text-[10px] text-[#7d8999]">
              Current rate: <b className="text-[#15925d]">GH₵ {rate}/kg</b> ·{" "}
              {paymentMethod}
            </p>
            <p className="mt-1 text-[10px] text-[#7d8999]">
              {totalAmount === null
                ? isCreditSale
                  ? "Enter a valid cylinder size and amount owed."
                  : "Enter a valid cylinder size and quantity to calculate the sale total."
                : isCreditSale
                  ? hasValidCreditAmount
                    ? `GH₵ ${enteredCreditAmount.toFixed(2)} will be recorded as outstanding credit.`
                    : "The credit amount must be more than GH₵ 0.00 and no more than the sale total."
                  : `${quantityValue} × ${selectedCylinderSize} cylinder${quantityValue === 1 ? "" : "s"} selected`}
            </p>
          </div>
          <button
            type="submit"
            disabled={totalAmount === null || !hasValidCreditAmount || saving}
            className="mt-4 flex h-14 w-full items-center justify-center rounded-xl bg-[#15925d] px-6 text-sm font-extrabold text-white shadow-[0_10px_22px_rgba(21,146,93,.24)] transition hover:-translate-y-0.5 hover:bg-[#117d4f] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {saving ? "Saving sale…" : `Record Sale · ${totalAmount === null ? "GH₵ —" : `GH₵ ${totalAmount.toFixed(2)}`}`}
          </button>
        </div>
        {notice && (
          <p
            role="status"
            className={`mt-4 rounded-xl px-3 py-2.5 text-[10px] font-bold ${notice.startsWith("Sale saved") ? "bg-[#effaf4] text-[#117d4f]" : "bg-[#fff4e8] text-[#a66011]"}`}
          >
            {notice}
          </p>
        )}
      </form>
    </section>
  );
}

function DashboardLayout({ onLogout, onProfileUpdated, user }) {
  const [active, setActive] = useState("dashboard");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [editingRate, setEditingRate] = useState(false);
  const [rate, setRate] = useState("0.00");
  const [salesRefreshKey, setSalesRefreshKey] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || "GasFlow user");
  const [profileDraftName, setProfileDraftName] = useState(user?.name || "GasFlow user");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileNotice, setProfileNotice] = useState("");
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const closeDrawer = (event) =>
      event.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", closeDrawer);
    return () => window.removeEventListener("keydown", closeDrawer);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    api("/station")
      .then(({ station }) => setRate((station.active_rate_pesewas_per_kg / 100).toFixed(2)))
      .catch(() => {});
  }, []);

  const saveRate = async (nextRate) => {
    const ratePesewasPerKg = Math.round(Number(nextRate) * 100);
    const { ratePesewasPerKg: savedRate } = await api("/station/rate", {
      method: "PUT",
      body: JSON.stringify({ ratePesewasPerKg }),
    });
    setRate((savedRate / 100).toFixed(2));
  };

  const selectPage = (page) => {
    setActive(page);
    setDrawerOpen(false);
  };
  const openProfile = () => {
    setDrawerOpen(false);
    setProfileDraftName(profileName);
    setNewPassword("");
    setConfirmPassword("");
    setProfileNotice("");
    setProfileOpen(true);
  };
  const saveProfile = async (event) => {
    event.preventDefault();
    const nextName = profileDraftName.trim();
    if (nextName.length < 2) {
      setProfileNotice("Enter a username with at least 2 characters.");
      return;
    }
    if (newPassword && newPassword.length < 8) {
      setProfileNotice("Your new password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setProfileNotice("Your new passwords do not match.");
      return;
    }
    try {
      const { user: updatedUser } = await authApi.updateProfile({
        name: nextName,
        ...(newPassword ? { password: newPassword } : {}),
      });
      setProfileName(updatedUser.name);
      setProfileDraftName(updatedUser.name);
      setNewPassword("");
      setConfirmPassword("");
      onProfileUpdated?.(updatedUser);
      setProfileNotice("Profile updated successfully.");
    } catch (requestError) {
      setProfileNotice(requestError.message || "We could not update your profile.");
    }
  };
  const copy = pageCopy[active] ?? pageCopy.dashboard;
  const ActivePage = pageComponents[active] ?? DashboardPage;
  const greeting = currentTime.getHours() < 12
    ? "Good morning"
    : currentTime.getHours() < 18
      ? "Good afternoon"
      : "Good evening";

  return (
    <div className={`h-[100dvh] overflow-hidden text-[#172132] ${darkMode ? "dashboard-dark bg-[#101114]" : "bg-[#f7f9fa]"}`}>
      <aside className={`fixed inset-y-0 left-0 z-30 hidden h-[100dvh] overflow-hidden bg-white transition-[width] duration-300 ease-out lg:flex ${sidebarCollapsed ? "w-[72px]" : "w-[224px]"}`}>
        <SidebarContent
          active={active}
          onSelect={selectPage}
          onLogout={onLogout}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((current) => !current)}
        />
      </aside>
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 cursor-default bg-[#0b1726]/45 backdrop-blur-sm"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="relative flex h-full w-[min(286px,calc(100vw-1rem))] animate-[sidebar-enter_220ms_ease-out] flex-col bg-white shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close navigation menu"
              className="absolute right-3 top-3 rounded-lg p-2 text-[#667587] hover:bg-[#f2f6f4] hover:text-[#117d4f]"
            >
              <X size={18} />
            </button>
            <SidebarContent
              isDrawer
              active={active}
              onSelect={selectPage}
              onLogout={onLogout}
            />
          </aside>
        </div>
      )}

      <div className={`flex h-[100dvh] flex-col overflow-hidden pb-[calc(5.6rem+env(safe-area-inset-bottom))] transition-[padding] duration-300 ease-out lg:pb-0 ${sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-[224px]"}`}>
        <header className="z-20 flex h-[68px] shrink-0 items-center justify-between border-b border-[#e5eaed] bg-[#f7f9fa]/90 px-4 backdrop-blur sm:px-7">
          <div className="flex items-center gap-3">
            <span className="text-[18px] font-extrabold tracking-[-.06em] text-[#172132]">
              GasFlow <span className="text-[#15925d]">•</span>
            </span>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation menu"
              className="rounded-lg p-2 text-[#334154] hover:bg-white lg:hidden"
            >
              <Menu size={21} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDarkMode((current) => !current)}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              aria-pressed={darkMode}
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              className="grid h-9 w-9 place-items-center rounded-xl border border-[#dfe7e4] bg-white text-[#566579] shadow-sm transition hover:-translate-y-px hover:border-[#b8d8c5] hover:text-[#117d4f]"
            >
              {darkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button
              type="button"
              onClick={openProfile}
              aria-label="Edit profile"
              title="Edit profile"
              className="grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-[#d9b643] text-[10px] font-extrabold tracking-[-.06em] text-[#27413f] shadow-sm transition hover:-translate-y-px hover:border-[#b8d8c5]"
            >
              {profileName
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((name) => name[0])
                .join("")
                .toUpperCase()}
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1320px] px-3 py-4 sm:px-7 sm:py-8">
          {active !== "record-sale" && (
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-bold tracking-[.12em] text-[#15925d]">
                  {copy.eyebrow}
                </p>
                <h2 className="mt-1 text-2xl font-extrabold tracking-[-.055em] text-[#172132] sm:text-3xl">
                  {active === "dashboard" ? `${greeting}, ${profileName.split(" ")[0]}.` : copy.title}
                </h2>
                <p className="mt-1 text-[12px] text-[#718093]">
                  {active === "dashboard"
                    ? "Your station is balanced and ready for today's deliveries."
                    : copy.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => selectPage("record-sale")}
                className="flex w-fit items-center gap-1.5 rounded-full bg-[#15925d] px-4 py-2.5 text-[11px] font-bold text-white shadow-[0_6px_14px_rgba(21,146,93,.18)] transition hover:-translate-y-px hover:bg-[#117d4f]"
              >
                <PlusCircle size={15} /> Add sale
              </button>
            </div>
          )}
          {active === "record-sale" && (
            <div className="mb-6">
              <p className="text-[10px] font-bold tracking-[.12em] text-[#15925d]">
                FORECOURT POS
              </p>
              <h2 className="mt-1 text-2xl font-extrabold tracking-[-.055em] text-[#172132] sm:text-3xl">
                Record a sale
              </h2>
              <p className="mt-1 text-[12px] text-[#718093]">
                Capture each cylinder sale quickly and accurately.
              </p>
            </div>
          )}
          <div key={active} className="page-transition">
            {active === "dashboard" ? (
              <ActivePage><SalesDashboard refreshKey={salesRefreshKey} /></ActivePage>
            ) : active === "record-sale" ? (
              <ActivePage><RecordSaleForm rate={rate} onEditRate={() => setEditingRate(true)} onSaleRecorded={() => setSalesRefreshKey((key) => key + 1)} /></ActivePage>
            ) : (
              <ActivePage rate={rate} onSaveRate={saveRate} />
            )}
          </div>
          </div>
        </main>
      </div>
      {profileOpen && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-[#0b1726]/40 p-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold tracking-[.12em] text-[#15925d]">ACCOUNT SETTINGS</p>
                <h2 id="profile-title" className="mt-1 text-xl font-extrabold tracking-[-.045em]">Edit profile</h2>
                <p className="mt-1 text-[11px] text-[#718093]">Update your username or choose a new password.</p>
              </div>
              <button
                type="button"
                onClick={() => setProfileOpen(false)}
                aria-label="Close profile editor"
                className="rounded-lg p-1.5 text-[#718093] hover:bg-[#f1f5f3]"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={saveProfile} className="mt-6 space-y-4">
              <label className="block">
                <span className="text-[11px] font-bold text-[#455267]">Username</span>
                <span className="mt-2 flex items-center rounded-xl border border-[#cde4d7] bg-[#f7fcf9] px-3 focus-within:border-[#15925d] focus-within:ring-4 focus-within:ring-[#15925d]/10">
                  <UserRound size={16} className="mr-2 shrink-0 text-[#718093]" />
                  <input
                    autoFocus
                    value={profileDraftName}
                    onChange={(event) => { setProfileDraftName(event.target.value); setProfileNotice(""); }}
                    autoComplete="username"
                    className="h-11 min-w-0 flex-1 bg-transparent text-[13px] font-semibold text-[#172132] outline-none"
                  />
                </span>
              </label>
              <div className="border-t border-[#edf0f2] pt-4">
                <p className="text-[11px] font-bold text-[#455267]">Change password <span className="font-medium text-[#8490a0]">(optional)</span></p>
                <label className="mt-2 block">
                  <span className="sr-only">New password</span>
                  <span className="flex items-center rounded-xl border border-[#dfe6e9] bg-white px-3 focus-within:border-[#15925d] focus-within:ring-4 focus-within:ring-[#15925d]/10">
                    <LockKeyhole size={16} className="mr-2 shrink-0 text-[#718093]" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(event) => { setNewPassword(event.target.value); setProfileNotice(""); }}
                      placeholder="New password"
                      autoComplete="new-password"
                      className="h-11 min-w-0 flex-1 bg-transparent text-[13px] font-medium text-[#172132] outline-none placeholder:text-[#a0aab5]"
                    />
                  </span>
                </label>
                <label className="mt-2 block">
                  <span className="sr-only">Confirm new password</span>
                  <span className="flex items-center rounded-xl border border-[#dfe6e9] bg-white px-3 focus-within:border-[#15925d] focus-within:ring-4 focus-within:ring-[#15925d]/10">
                    <LockKeyhole size={16} className="mr-2 shrink-0 text-[#718093]" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => { setConfirmPassword(event.target.value); setProfileNotice(""); }}
                      placeholder="Confirm new password"
                      autoComplete="new-password"
                      className="h-11 min-w-0 flex-1 bg-transparent text-[13px] font-medium text-[#172132] outline-none placeholder:text-[#a0aab5]"
                    />
                  </span>
                </label>
              </div>
              {profileNotice && <p role="status" className={`rounded-xl px-3 py-2.5 text-[10px] font-bold ${profileNotice === "Profile updated successfully." ? "bg-[#effaf4] text-[#117d4f]" : "bg-[#fff4e8] text-[#a66011]"}`}>{profileNotice}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setProfileOpen(false)} className="rounded-full px-4 py-2.5 text-[11px] font-bold text-[#627084] hover:bg-[#f1f5f3]">Cancel</button>
                <button type="submit" className="rounded-full bg-[#15925d] px-4 py-2.5 text-[11px] font-bold text-white hover:bg-[#117d4f]">Save changes</button>
              </div>
            </form>
          </section>
        </div>
      )}
      {editingRate && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-[#0b1726]/40 p-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="rate-title"
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold tracking-[.12em] text-[#15925d]">
                  ACTIVE PUMP PRICE
                </p>
                <h2
                  id="rate-title"
                  className="mt-1 text-xl font-extrabold tracking-[-.045em]"
                >
                  Edit gas rate
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingRate(false)}
                aria-label="Close gas rate editor"
                className="rounded-lg p-1.5 text-[#718093] hover:bg-[#f1f5f3]"
              >
                <X size={18} />
              </button>
            </div>
            <label className="mt-6 block">
              <span className="text-[11px] font-bold text-[#455267]">
                Price per kilogram (GH₵)
              </span>
              <input
                autoFocus
                value={rate}
                onChange={(event) => setRate(event.target.value)}
                inputMode="decimal"
                className="mt-2 h-12 w-full rounded-xl border border-[#cde4d7] bg-[#f7fcf9] px-3 text-base font-extrabold text-[#172132] outline-none focus:border-[#15925d] focus:ring-4 focus:ring-[#15925d]/10"
              />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingRate(false)}
                className="rounded-full px-4 py-2.5 text-[11px] font-bold text-[#627084] hover:bg-[#f1f5f3]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setEditingRate(false)}
                className="rounded-full bg-[#15925d] px-4 py-2.5 text-[11px] font-bold text-white hover:bg-[#117d4f]"
              >
                Save rate
              </button>
            </div>
          </section>
        </div>
      )}
      <nav
        aria-label="Quick navigation"
        className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.55rem,env(safe-area-inset-bottom))] lg:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-3 gap-1 rounded-[22px] border border-[#dfe8e4] bg-white/95 p-1.5 shadow-[0_10px_28px_rgba(23,33,50,.14)] backdrop-blur-xl">
          {primaryItems
            .filter((item) =>
              ["record-sale", "today", "debts"].includes(item.id),
            )
            .map((item) => (
              <MobileNavItem
                key={item.id}
                item={item}
                active={active}
                onSelect={selectPage}
              />
            ))}
        </div>
      </nav>
    </div>
  );
}

export default DashboardLayout;
