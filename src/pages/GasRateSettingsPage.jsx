import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  CircleDollarSign,
  Info,
  Scale,
  ShieldCheck,
} from "lucide-react";

const cylinderSizes = [3, 5, 7, 13, 14.5, 25, 50];

function GasRateSettingsPage({ rate = "0.00", onSaveRate = () => {} }) {
  const [draftRate, setDraftRate] = useState(rate);
  const [saved, setSaved] = useState(false);

  useEffect(() => setDraftRate(rate), [rate]);

  const numericRate = Number(draftRate);
  const isValidRate = Number.isFinite(numericRate) && numericRate > 0;
  const ratePreview = useMemo(
    () =>
      cylinderSizes.map((size) => ({
        size,
        total: isValidRate ? size * numericRate : 0,
      })),
    [isValidRate, numericRate],
  );
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-GH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

  const saveRate = async () => {
    if (!isValidRate) return;
    const newRate = numericRate.toFixed(2);
    try {
      await onSaveRate(newRate);
      setDraftRate(newRate);
      setSaved(true);
    } catch {
      setSaved(false);
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(280px,.75fr)]">
      <div className="space-y-5">
        <section className="rounded-2xl border border-[#e5eaed] bg-white p-5 shadow-[0_5px_18px_rgba(20,35,54,.035)] sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] font-bold tracking-[.12em] text-[#15925d]">
                ACTIVE SELLING RATE
              </p>
              <h3 className="mt-1 text-xl font-extrabold tracking-[-.045em] text-[#172132]">
                Set your price per kilogram
              </h3>
              <p className="mt-1 max-w-lg text-[11px] leading-relaxed text-[#718093]">
                This rate is applied to every new cylinder sale. Existing sales
                and reconciled shifts will not be changed.
              </p>
            </div>
            <span className="flex w-fit items-center gap-1.5 rounded-full bg-[#effaf4] px-3 py-1.5 text-[10px] font-bold text-[#117d4f]">
              <CheckCircle2 size={14} /> Live at POS
            </span>
          </div>

          <div className="mt-6 rounded-2xl border border-[#cde4d7] bg-[#f5fbf7] p-4 sm:p-5">
            <label className="block">
              <span className="text-[11px] font-bold text-[#455267]">
                Price per kilogram (GH₵)
              </span>
              <div className="mt-2 flex items-center overflow-hidden rounded-xl border border-[#bcdcc9] bg-white focus-within:border-[#15925d] focus-within:ring-4 focus-within:ring-[#15925d]/10">
                <span className="border-r border-[#e1eee6] px-3.5 text-sm font-extrabold text-[#15925d]">
                  GH₵
                </span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  value={draftRate}
                  onChange={(event) => {
                    setDraftRate(event.target.value);
                    setSaved(false);
                  }}
                  aria-describedby="rate-help"
                  className="h-14 min-w-0 flex-1 bg-transparent px-3 text-xl font-extrabold tracking-[-.04em] text-[#172132] outline-none"
                />
                <span className="pr-3.5 text-[11px] font-bold text-[#718093]">
                  per kg
                </span>
              </div>
            </label>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p id="rate-help" className={`text-[10px] ${isValidRate ? "text-[#718093]" : "font-bold text-[#b65039]"}`}>
                {isValidRate
                  ? "Use a single station-wide rate to keep sales and reports aligned."
                  : "Enter a price greater than GH₵ 0.00 to save this rate."}
              </p>
              <button
                type="button"
                disabled={!isValidRate}
                onClick={saveRate}
                className="rounded-full bg-[#15925d] px-5 py-2.5 text-[11px] font-bold text-white shadow-[0_7px_14px_rgba(21,146,93,.18)] transition hover:-translate-y-0.5 hover:bg-[#117d4f] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"
              >
                Save active rate
              </button>
            </div>
            {saved && (
              <p role="status" className="mt-3 flex items-center gap-1.5 rounded-xl bg-white px-3 py-2.5 text-[10px] font-bold text-[#117d4f]">
                <CheckCircle2 size={14} /> Rate saved — new POS entries now use GH₵ {formatCurrency(numericRate)}/kg.
              </p>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#e5eaed] bg-white shadow-[0_5px_18px_rgba(20,35,54,.035)]">
          <div className="flex items-center justify-between border-b border-[#edf0f2] px-5 py-4">
            <div>
              <p className="text-[10px] font-bold tracking-[.12em] text-[#15925d]">
                PRICE PREVIEW
              </p>
              <h3 className="mt-1 text-base font-extrabold text-[#172132]">
                Cylinder totals at this rate
              </h3>
            </div>
            <Scale size={18} className="text-[#15925d]" />
          </div>
          <div className="grid divide-y divide-[#edf0f2] sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            <div className="divide-y divide-[#edf0f2]">
              {ratePreview.slice(0, 4).map((item) => (
                <PriceRow key={item.size} {...item} formatCurrency={formatCurrency} />
              ))}
            </div>
            <div className="divide-y divide-[#edf0f2]">
              {ratePreview.slice(4).map((item) => (
                <PriceRow key={item.size} {...item} formatCurrency={formatCurrency} />
              ))}
            </div>
          </div>
        </section>
      </div>

      <aside className="space-y-5">
        <section className="rounded-2xl bg-[#152438] p-5 text-white shadow-[0_8px_20px_rgba(20,35,54,.12)]">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/[.12] text-[#58d7a6]">
            <CircleDollarSign size={19} />
          </span>
          <p className="mt-4 text-[10px] font-bold tracking-[.12em] text-[#b7c5d2]">CURRENT RATE</p>
          <p className="mt-1 text-3xl font-extrabold tracking-[-.06em]">GH₵ {formatCurrency(Number(rate))}</p>
          <p className="mt-1 text-[11px] text-[#b7c5d2]">per kilogram · active across the station</p>
          <div className="mt-5 border-t border-white/[.1] pt-4 text-[10px] text-[#b7c5d2]">
            Price changes take effect as soon as they are saved.
          </div>
        </section>
        <section className="rounded-2xl border border-[#e7ecef] bg-white p-5 shadow-[0_5px_15px_rgba(20,35,54,.035)]">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#effaf4] text-[#15925d]">
            <ShieldCheck size={19} />
          </span>
          <h3 className="mt-3 text-[13px] font-extrabold text-[#172132]">Pricing safeguard</h3>
          <p className="mt-1 text-[10px] leading-relaxed text-[#718093]">
            Only station managers should change the active rate. Record the supplier price in your daily shift notes before making an update.
          </p>
          <p className="mt-4 flex items-start gap-1.5 text-[10px] font-semibold leading-relaxed text-[#617084]">
            <Info size={14} className="mt-px shrink-0 text-[#15925d]" />
            The rate applies from the moment you save it.
          </p>
        </section>
      </aside>
    </div>
  );
}

function PriceRow({ size, total, formatCurrency }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <span className="text-[11px] font-bold text-[#455267]">{size} kg cylinder</span>
      <span className="text-[12px] font-extrabold text-[#172132]">GH₵ {formatCurrency(total)}</span>
    </div>
  );
}

export default GasRateSettingsPage;
