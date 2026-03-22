import SectionChip from "./SectionChip";
import { useReveal } from "./useReveal";
import { Bot, LayoutPanelLeft, Sparkle, Cpu} from 'lucide-react';

const values = [
  { icon: <Bot className="text-green-400"/>, title: "IoT", desc: "Otomasi, monitoring, pengumpulan data dan kontrol perangkat industri guna pengambilan keputusan yang lebih baik." },
  { icon: <LayoutPanelLeft className="text-blue-400"/>, title: "Software", desc: "Perangkat lunak interaktif untuk memudahkan pencatatan data, transaksi, dan pengambilan keputusan" },
  { icon: <Sparkle className="text-violet-400"/>, title: "AI", desc: "Sistem analisa yang berjalan sendiri tanpa mengharuskan pengguna untuk menganalisa manual." },
  { icon: <Cpu className="text-indigo-400"/>, title: "IT Solution", desc: "Suatu sistem perangkat yang dirancang untuk membantu bisnis meningkatkan efisiensi, produktivitas, dan keamanan operasional." },
];

const nums = [
  { val: "2025", label: "Tahun Berdiri" },
  { val: "4.9★", label: "Rating Pengguna" },
];

export default function About() {
  const { ref: leftRef, visible: leftVisible } = useReveal();
  const { ref: rightRef, visible: rightVisible } = useReveal();

  return (
    <section id="about" className="py-24 px-6">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
        {/* Left visual */}
        <div
          ref={leftRef}
          style={{
            opacity: leftVisible ? 1 : 0,
            transform: leftVisible ? "translateY(0)" : "translateY(28px)",
            transition: "opacity 0.7s ease, transform 0.7s ease",
          }}
        >
          {/* Hero card */}
          <div className="relative bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl p-10 text-center mb-5 shadow-2xl shadow-blue-300/40 overflow-hidden">
            <div className="absolute top-[-60px] right-[-60px] w-56 h-56 rounded-full bg-white/10" />
            <div className="absolute bottom-[-40px] left-[-40px] w-40 h-40 rounded-full bg-white/05" />
            <p className="text-6xl relative z-10">🏭</p>
            <p className="font-black text-white text-xl mt-3 relative z-10">Aihako Technology</p>
            <p className="text-blue-200 text-sm mt-1 relative z-10">Est. 2025 · Jember, Jawa Timur</p>
          </div>

          {/* Values grid */}
          <div className="grid grid-cols-2 gap-3">
            {values.map((v) => (
              <div
                key={v.title}
                className="bg-white border-2 border-blue-100 rounded-2xl p-4 hover:border-blue-300 hover:shadow-md hover:-translate-y-1 transition-all duration-250"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-lg mb-3">
                  {v.icon}
                </div>
                <p className="font-extrabold text-slate-800 text-sm mb-1">{v.title}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right text */}
        <div
          ref={rightRef}
          style={{
            opacity: rightVisible ? 1 : 0,
            transform: rightVisible ? "translateY(0)" : "translateY(28px)",
            transition: "opacity 0.7s ease 0.15s, transform 0.7s ease 0.15s",
          }}
        >
          <SectionChip>🏢 Tentang Kami</SectionChip>
          <h2 className="text-4xl font-black text-slate-900 leading-tight tracking-tight mb-5">
            Kami Hadir untuk<br />Kemudahan Anda
          </h2>
          <p className="text-slate-500 leading-relaxed mb-4">
            Aihako Technology adalah perusahaan startup di bidang teknologi yang berfokus pada kemudahan dalam berbisnis. Didirikan pada tahun 2025 dan telah menangani permasalahan dengan pendekatan berbasis teknologi. 
          </p>
          <p className="text-slate-500 leading-relaxed mb-8">
            Kami percaya bahwa perkembangan teknologi terutama AI dapat lebih meningkatkan produktivitas, efisiensi dan keamanan operasional.
          </p>

          {/* Numbers */}
          <div className="flex gap-8 flex-wrap">
            {nums.map((n) => (
              <div key={n.label}>
                <p className="font-black text-3xl text-blue-600 leading-none">{n.val}</p>
                <p className="text-xs text-slate-400 font-semibold mt-1">{n.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
