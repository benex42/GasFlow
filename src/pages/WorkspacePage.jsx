import { MoreHorizontal } from "lucide-react";

function WorkspaceStat({ label, value, note, tone = "green" }) {
  const tones = {
    green: "bg-[#eaf8f0] text-[#15925d]",
    navy: "bg-[#edf1f6] text-[#26354b]",
    gold: "bg-[#fff7e8] text-[#bd7a12]",
  };

  return (
    <article className="rounded-2xl border border-[#e7ecef] bg-white p-4 shadow-[0_5px_15px_rgba(20,35,54,.035)]">
      <span className={`inline-flex rounded-lg px-2 py-1 text-[9px] font-bold ${tones[tone]}`}>
        {label}
      </span>
      <p className="mt-3 text-2xl font-extrabold tracking-[-.055em] text-[#172132]">
        {value}
      </p>
      <p className="mt-1 text-[10px] text-[#778496]">{note}</p>
    </article>
  );
}

function WorkspacePage({ title }) {
  return (
    <section className="rounded-2xl border border-[#e5eaed] bg-white p-6 shadow-[0_5px_18px_rgba(20,35,54,.035)]">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold">{title}</h3>
          <p className="mt-1 text-[11px] text-[#718093]">
            This workspace is ready for your records.
          </p>
        </div>
        <MoreHorizontal size={19} className="text-[#8390a0]" />
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <WorkspaceStat label="TODAY" value="GH₵ 0.00" note="No transactions recorded yet" />
        <WorkspaceStat label="THIS MONTH" value="GH₵ 0.00" note="No sales recorded yet" tone="navy" />
        <WorkspaceStat label="OUTSTANDING" value="GH₵ 0.00" note="No credit balances yet" tone="gold" />
      </div>
    </section>
  );
}

export default WorkspacePage;
