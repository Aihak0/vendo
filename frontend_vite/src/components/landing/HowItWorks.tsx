import SectionChip from "./SectionChip";
import { useReveal } from "./useReveal";
import {MapPin, MousePointerClickIcon, CreditCard, PartyPopper} from 'lucide-react';

const steps = [
  {
    num: "01",
    icon: <MapPin className="text-red-400"/>,
    title: "Cari Mesin Terdekat",
    desc: "Temukan mesin vendo di kampus, kantor, rumah sakit, atau pusat perbelanjaan di kotamu.",
  },
  {
    num: "02",
    icon: <MousePointerClickIcon className="text-slate-600"/>,
    title: "Pilih Produk Favoritmu",
    desc: "Lihat tampilan layar, Pilih kode produk yang ingin kamu beli dengan mudah.",
  },
  {
    num: "03",
    icon: <CreditCard className="text-blue-400"/>,
    title: "Bayar Cashless",
    desc: "Bayar dengan QRIS, atau, e-wallet. Cepat dan aman.",
  },
  {
    num: "04",
    icon: <PartyPopper className="text-purple-400"/>,
    title: "Ambil & Nikmati!",
    desc: "Produk langsung keluar! Ambil di slot bawah dan nikmati cemilan atau minumanmu.",
  },
];

function StepCard({ step, delay }: { step: typeof steps[0]; delay: number }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className="relative bg-white border-2 border-blue-100 rounded-3xl p-7 overflow-hidden
        hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100 hover:-translate-y-1.5
        transition-all duration-300"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms, box-shadow 0.3s, border-color 0.3s, translateY 0.3s`,
      }}
    >
      {/* Big number bg */}
      <span className="absolute top-3 right-5 text-[5.5rem] font-black text-blue-50 leading-none select-none pointer-events-none">
        {step.num}
      </span>

      <div className="relative z-10">
        <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-2xl mb-5">
          {step.icon}
        </div>
        <h3 className="font-extrabold text-base text-slate-800 mb-2">{step.title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
      </div>
    </div>
  );
}

export default function HowItWorks() {
  const { ref, visible } = useReveal();
  return (
    <section id="how" className="bg-blue-50/60 py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div
          ref={ref}
          className="flex flex-wrap justify-between items-end gap-6 mb-12"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}
        >
          <div>
            <SectionChip>✦ Cara Kerja</SectionChip>
            <h2 className="text-4xl font-black text-slate-900 leading-tight tracking-tight">
              Belanja Itu Semudah<br />4 Langkah Saja
            </h2>
          </div>
          <p className="text-slate-500 text-base leading-relaxed max-w-sm">
            Tanpa ribet, tanpa antre. Semua selesai dalam hitungan detik.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((step, i) => (
            <StepCard key={step.num} step={step} delay={i * 100} />
          ))}
        </div>
      </div>
    </section>
  );
}
