import { useEffect, useMemo, useState } from "react";
import { CircleDollarSign, PackageCheck, Scale } from "lucide-react";
import { api } from "../api";

function TodaySummaryPage() {
  const [sales, setSales] = useState([]);
  const today = new Date();
  const dateKey = (date) =>
    `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  const todayKey = dateKey(today);

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

  const todaySales = useMemo(
    () => sales.filter((sale) => dateKey(new Date(sale.sold_at)) === todayKey),
    [sales, todayKey],
  );
  const cylinderSummary = useMemo(() => {
    const summary = new Map();
    for (const sale of todaySales) {
      const weight = Number(sale.cylinder_weight_grams) / 1000;
      const key = `${weight} kg`;
      const current = summary.get(key) || { size: key, quantity: 0, netTotal: 0, weight };
      current.quantity += Number(sale.quantity) || 0;
      current.netTotal += (Number(sale.total_pesewas) || 0) / 100;
      summary.set(key, current);
    }
    return [...summary.values()].sort((first, second) => first.weight - second.weight);
  }, [todaySales]);
  const totalCylinders = cylinderSummary.reduce(
    (total, item) => total + item.quantity,
    0,
  );
  const netTotal = cylinderSummary.reduce(
    (total, item) => total + item.netTotal,
    0,
  );
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-GH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-[#dce9e2] bg-[#effaf4] p-4">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-white text-[#15925d] shadow-sm">
            <PackageCheck size={17} />
          </span>
          <p className="mt-3 text-2xl font-extrabold tracking-[-.055em] text-[#172132]">
            {totalCylinders}
          </p>
          <p className="mt-1 text-[10px] font-bold text-[#617084]">
            Cylinders taken today
          </p>
        </article>
        <article className="rounded-2xl border border-[#e7ecef] bg-white p-4 shadow-[0_5px_15px_rgba(20,35,54,.035)]">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#edf1f6] text-[#26354b]">
            <Scale size={17} />
          </span>
          <p className="mt-3 text-2xl font-extrabold tracking-[-.055em] text-[#172132]">
            {cylinderSummary.length}
          </p>
          <p className="mt-1 text-[10px] font-bold text-[#617084]">
            Cylinder types taken
          </p>
        </article>
        <article className="rounded-2xl bg-[#152438] p-4 text-white shadow-[0_8px_20px_rgba(20,35,54,.12)]">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/[.12] text-[#56d7a4]">
            <CircleDollarSign size={17} />
          </span>
          <p className="mt-3 text-2xl font-extrabold tracking-[-.055em]">
            GH₵ {formatCurrency(netTotal)}
          </p>
          <p className="mt-1 text-[10px] font-bold text-[#b7c5d2]">
            Net total for today
          </p>
        </article>
      </div>

      <section className="mt-6 overflow-hidden rounded-2xl border border-[#e5eaed] bg-white shadow-[0_5px_18px_rgba(20,35,54,.035)]">
        <div className="flex items-center justify-between border-b border-[#edf0f2] px-5 py-4">
          <div>
            <p className="text-[10px] font-bold tracking-[.12em] text-[#15925d]">
              DAILY CYLINDER SUMMARY
            </p>
            <h3 className="mt-1 text-base font-extrabold text-[#172132]">
              Cylinders taken today
            </h3>
          </div>
          <span className="rounded-full bg-[#effaf4] px-3 py-1.5 text-[10px] font-bold text-[#117d4f]">
            {totalCylinders} cylinders
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] text-left">
            <thead className="bg-[#f8fafb] text-[9px] font-bold tracking-[.09em] text-[#8490a0]">
              <tr>
                <th className="px-5 py-3">CYLINDER TYPE</th>
                <th className="px-5 py-3 text-center">QUANTITY</th>
                <th className="px-5 py-3 text-right">NET TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {cylinderSummary.map((item) => (
                <tr key={item.size} className="border-t border-[#f0f2f4] text-[12px]">
                  <td className="px-5 py-4 font-extrabold text-[#344052]">
                    {item.size} cylinder
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="inline-flex min-w-9 justify-center rounded-full bg-[#effaf4] px-2.5 py-1 text-[10px] font-extrabold text-[#117d4f]">
                      {item.quantity}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right font-extrabold text-[#172132]">
                    GH₵ {formatCurrency(item.netTotal)}
                  </td>
                </tr>
              ))}
              {cylinderSummary.length === 0 && (
                <tr className="border-t border-[#f0f2f4]">
                  <td colSpan="3" className="px-5 py-10 text-center text-[11px] text-[#8290a0]">
                    No cylinder sales have been recorded today.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="border-t-2 border-[#cde4d7] bg-[#f3faf6]">
              <tr>
                <td className="px-5 py-4 text-[11px] font-extrabold tracking-[.08em] text-[#117d4f]">
                  NET TOTAL
                </td>
                <td className="px-5 py-4 text-center text-[11px] font-extrabold text-[#344052]">
                  {totalCylinders} units
                </td>
                <td className="px-5 py-4 text-right text-base font-extrabold text-[#117d4f]">
                  GH₵ {formatCurrency(netTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

    </div>
  );
}

export default TodaySummaryPage;
