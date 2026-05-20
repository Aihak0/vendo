import SectionChip from "./SectionChip";
import { useReveal } from "./useReveal";

import { ClockArrowUp, Star, GlassWater, Balloon, Calculator } from "lucide-react";

const machines = [
  {
    emoji: "🚆",
    badge: <div className="flex gap-2 items-center"><ClockArrowUp size={13} /><span>New</span></div>,
    badgeClass: "bg-blue-100 text-blue-700",
    bgClass: "from-blue-100 to-blue-200",
    name: "Vendo S1",
    desc: "Menyediakan minuman dingin dan snack ringan, Berlokasi Di stasiun.",
    specs: ["Minuman", "Snack", "QRIS + E-Wallet"],
  },
  {
    emoji: "🏫",
    badge: <div className="flex gap-2 items-center"><Star size={13}/><span>New</span></div>,
    badgeClass: "bg-emerald-100 text-emerald-700",
    bgClass: "from-emerald-50 to-blue-100",
    name: "Vendo Pro X2",
    desc: "Menyediakan minuman dingin, Manisan dan snack ringan, Berlokasi di kampus",
    specs: ["60 Slot", "Snack", "Minuman", "Makanan Instan"],
  },
  {
    emoji: "🏢",
    badge: <div className="flex gap-2 items-center"><GlassWater size={13}/><span>Drink</span></div>,
    badgeClass: "bg-sky-100 text-sky-700",
    bgClass: "from-gray-100 to-slate-300",
    name: "VendoMart C1",
    desc: "Menyediakan kopi, isotonik, soda, dan jus. Berlokasi di kantor",
    specs: ["20 Slot", "Minuman"],
  },
  {
    emoji: "🌴",
    badge: <div className="flex gap-2 items-center"><Balloon size={13}/><span>Fun</span></div>,
    badgeClass: "bg-amber-100 text-amber-700",
    bgClass: "from-amber-50 to-blue-50",
    name: "VendoMart M1",
    desc: "Menyedikan Fun drink, kopi, makanan instant, dan snack. Berlokasi di tempat wisata",
    specs: ["50 Slot", "fun drink", "Snack"],
  },
];

function MachineCard({ machine, delay }: { machine: typeof machines[0]; delay: number }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className="bg-white border-2 border-blue-100 rounded-3xl overflow-hidden flex
        hover:border-blue-300 hover:shadow-xl hover:shadow-blue-100/60 hover:-translate-y-1
        transition-all duration-300"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms, box-shadow 0.3s, border-color 0.3s`,
      }}
    >
      {/* Left visual */}
      <div className={`w-32 flex-shrink-0 bg-gradient-to-br ${machine.bgClass} flex items-center justify-center text-5xl p-4`}>
        {machine.emoji}
      </div>

      {/* Right info */}
      <div className="p-5 flex-1">
        <span className={`inline-block text-[10px] font-extrabold px-2.5 py-1 rounded-full mb-2 ${machine.badgeClass}`}>
          {machine.badge}
        </span>
        <h3 className="font-extrabold text-slate-800 text-base mb-1.5">{machine.name}</h3>
        <p className="text-sm text-slate-500 leading-relaxed mb-3">{machine.desc}</p>
        <div className="flex flex-wrap gap-1.5">
          {machine.specs.map((s) => (
            <span key={s} className="bg-blue-50 text-blue-700 text-[11px] font-bold px-2.5 py-1 rounded-full">
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Machines() {
  const { ref, visible } = useReveal();
  return (
    <section id="machines" className="bg-blue-50/60 py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div
          ref={ref}
          className="mb-10"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}
        >
          <SectionChip><Calculator size={14}/> Mesin Kami</SectionChip>
          <h2 className="text-3xl font-black text-slate-900 leading-tight tracking-tight">
            Unit Mesin yang Tersedia
          </h2>
          <p className="text-slate-400 py-3 px-1">
            Setiap unit mesin kami menyediakan berbagai produk yang dapat dibeli langsung menggunakan metode pembayaran digital seperti QRIS dan e-wallet.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {machines.map((m, i) => (
            <MachineCard key={m.name} machine={m} delay={i * 100} />
          ))}
        </div>
      </div>
    </section>
  );
}
