import {Cookie, Croissant, Popcorn, Pizza, Candy, Hamburger, Coffee, GlassWater, Milk} from 'lucide-react';

const slots = [
  { code: "A1", emoji: <Croissant size={20} className='text-orange-400'/>  }, { code: "A2", emoji: <Candy size={20} className='text-pink-400'/> }, { code: "A3", emoji: <Cookie size={20} className='text-amber-500'/>  },
  { code: "B1", emoji: <Pizza size={20} className='text-yellow-500'/>  }, { code: "B2", emoji: <Popcorn size={20} className='text-red-400'/>  }, { code: "B3", emoji: <Hamburger size={20} className='text-amber-900/50'/>  },
  { code: "C1", emoji: <Coffee size={20} className='text-orange-900/50'/>  }, { code: "C2", emoji: <GlassWater size={20} className='text-blue-500'/>  }, { code: "C3", emoji: <Milk size={20} className='text-neutral-400'/>  },
];

const payments = ["QRIS", "e-Wallet"];

export default function VendingMachineIllustration() {
  return (
    <div className="relative w-72 animate-[floatY_5s_ease-in-out_infinite]">
      <style>{`
        @keyframes floatY {
          0%, 100% { transform: translateY(0px) rotate(-1deg); }
          50% { transform: translateY(-18px) rotate(1deg); }
        }
        @keyframes shadowAnim {
          0%, 100% { transform: translateX(-50%) scaleX(1); opacity: 0.7; }
          50% { transform: translateX(-50%) scaleX(0.7); opacity: 0.3; }
        }
      `}</style>

      {/* Machine Body */}
      <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-100 rounded-3xl p-5 shadow-2xl shadow-blue-200/50">
        {/* Top stripe */}
        <div className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 mb-4" />

        {/* Screen */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-3 mb-4 text-center shadow-inner">
          <p className="text-blue-400 text-[10px] font-bold tracking-widest uppercase mb-1">
            ✦ Vendo ✦
          </p>
          <p className="text-white font-black text-2xl leading-none">Rp 8.000</p>
          <p className="text-blue-300 text-[10px] mt-1">Pilih produk</p>
        </div>

        {/* Slot Grid */}
        <div className="grid grid-cols-3 gap-1.5 mb-3">
          {slots.map((s) => (
            <div
              key={s.code}
              className="bg-blue-50 border-2 border-blue-100 hover:border-blue-300 hover:bg-blue-100 rounded-xl py-2 flex flex-col items-center gap-0.5 cursor-pointer transition-all hover:scale-105"
            >
              <span className="text-xl">{s.emoji}</span>
              <span className="text-[9px] font-extrabold text-blue-400">{s.code}</span>
            </div>
          ))}
        </div>

        {/* Tray */}
        <div className="bg-blue-50 border-2 border-dashed border-blue-200 rounded-xl h-9 mb-3 flex items-center justify-center">
          <span className="text-[9px] font-bold text-blue-300 tracking-widest">AMBIL PRODUK DI SINI</span>
        </div>

        {/* Payment badges */}
        <div className="flex gap-1.5 justify-center flex-wrap">
          {payments.map((p) => (
            <span
              key={p}
              className="bg-blue-100 text-blue-700 text-[9px] font-extrabold px-2 py-1 rounded-full"
            >
              {p}
            </span>
          ))}
        </div>
      </div>

      {/* Shadow */}
      <div
        className="absolute -bottom-5 left-1/2 w-48 h-5 rounded-full bg-blue-300/20 blur-md"
        style={{ animation: "shadowAnim 5s ease-in-out infinite" }}
      />
    </div>
  );
}
