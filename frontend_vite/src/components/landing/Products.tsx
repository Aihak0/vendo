
import SectionChip from "./SectionChip";
import { useReveal } from "./useReveal";
import { Boxes } from "lucide-react";

const products = [
  {
    emoji: "🥤",
    tag: "Minuman Dingin",
    name: "Minuman Segar Pilihan",
    desc: "Teh botol, air mineral, isotonik, jus buah, dan minuman berenergi terbaik.",
    price: "Mulai Rp 4.000",
  },
  {
    emoji: "🍬",
    tag: "Snack Manis",
    name: "Manisan & Wafer",
    desc: "Berbagai pilihan coklat, wafer, permen, dan snack manis.",
    price: "Mulai Rp 5.000",
  },
  {
    emoji: "🍿",
    tag: "Snack Asin",
    name: "Keripik & Kacang",
    desc: "Keripik kentang, keripik tempe, kacang panggang, dan snack gurih pilihan.",
    price: "Mulai Rp 5.000",
  },
  {
    emoji: "🍙",
    tag: "Makanan Instan",
    name: "Sandwinch & Onigiri",
    desc: "Onigiri, Sandwich, dan makanan instan siap makan di tengah kesibukan.",
    price: "Mulai Rp 8.000",
  },
];

function ProductCard({ product, delay }: { product: typeof products[0]; delay: number }) {
  const { ref, visible } = useReveal();

  return (
    <div
      ref={ref}
      className="bg-white border-2 border-blue-100 rounded-3xl overflow-hidden
        hover:border-blue-300 hover:shadow-xl hover:shadow-blue-100/60 hover:-translate-y-1.5
        transition-all duration-300 cursor-pointer group"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms, box-shadow 0.3s, border-color 0.3s`,
      }}
    >
      {/* Emoji box */}
      <div className="h-36 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform duration-300">
        {product.emoji}
      </div>

      <div className="p-5">
        <span className="inline-block bg-blue-100 text-blue-700 text-[11px] font-bold px-3 py-1 rounded-full mb-2">
          {product.tag}
        </span>
        <h3 className="font-extrabold text-slate-800 text-base mb-1.5">{product.name}</h3>
        <p className="text-sm text-slate-500 leading-relaxed mb-4">{product.desc}</p>
        <div className="flex items-center justify-between">
          <span className="font-black text-blue-600 text-lg">{product.price}</span>
          {/* <button
            onClick={handleAdd}
            className={`w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-200
              ${added
                ? "bg-blue-600 text-white scale-110"
                : "bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white"
              }`}
          >
            {added ? "✓" : "+"}
          </button> */}
        </div>
      </div>
    </div>
  );
}

export default function Products() {
  const { ref, visible } = useReveal();
  return (
    <section id="products" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div
          ref={ref}
          className="flex flex-wrap justify-between items-end gap-4 mb-10"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}
        >
          <div>
            <SectionChip><Boxes size={14}/> Produk Kami</SectionChip>
            <h2 className="text-4xl font-black text-slate-900 leading-tight tracking-tight">
              Apa yang Kami Jual
            </h2>
          </div>
          <a
            href="#contact"
            className="text-sm font-bold text-blue-600 border-2 border-blue-200 px-5 py-2.5 rounded-full hover:bg-blue-50 hover:border-blue-400 transition-all"
          >
            Request Produk →
          </a>
        </div>

        <div className="grid grid-cols-4 gap-5">
          {products.map((p, i) => (
            <ProductCard key={p.name} product={p} delay={i * 80} />
          ))}
        </div>
      </div>
    </section>
  );
}
