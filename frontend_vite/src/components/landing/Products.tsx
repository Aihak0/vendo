import { useState } from "react";
import SectionChip from "./SectionChip";
import { useReveal } from "./useReveal";
import { Boxes, ChevronDown } from "lucide-react";

const categories = [
  {
    emoji: "🥤",
    tag: "Minuman Dingin",
    name: "Minuman Segar Pilihan",
    color: "blue",
    products: [
      { name: "Teh Kotak", sub: "Original", price: "Rp 5.000" },
      { name: "Teh Botol", sub: "Original", price: "Rp 5.000" },
      { name: "Aqua", sub: "Air botol", price: "Rp 3.500" },
      { name: "Le minerale", sub: "Air Botol", price: "Rp 3.000" },
      { name: "Pocari Sweat", sub: "Isotonik", price: "Rp 8.000" },
      { name: "Mizone", sub: "Isotonik, aneka rasa", price: "Rp 8.000" },
    ],
  },
  {
    emoji: "🍬",
    tag: "Snack Manis",
    name: "Manisan & Wafer",
    color: "amber",
    products: [
      { name: "Silverqueen", sub: "Coklat kacang", price: "Rp 10.000" },
      { name: "Kit Kat", sub: "Wafer coklat", price: "Rp 8.000" },
      { name: "Tango", sub: "Wafer", price: "Rp 5.000" },
      { name: "Oreo", sub: "Biskuit krim", price: "Rp 3.000" },
      { name: "Beng Beng", sub: "Wafer Coklat batang", price: "Rp 4.000" },
    ],
  },
  {
    emoji: "🍿",
    tag: "Snack Asin",
    name: "Keripik & Kacang",
    color: "coral",
    products: [
      { name: "Chitato", sub: "Keripik kentang", price: "Rp 7.000" },
      { name: "Lays", sub: "Keripik kentang", price: "Rp 6.000" },
      { name: "Pringles", sub: "Keripik kentang", price: "Rp 15.000" },
      { name: "Garuda Rosta", sub: "Kacang panggang", price: "Rp 6.000" },
      { name: "Sukro", sub: "Kacang panggang", price: "Rp 6.000" },
      { name: "Cheetos", sub: "Snack jagung", price: "Rp 6.000" },
    ],
  },
  {
    emoji: "🌭",
    tag: "Makanan Instan",
    name: "Sosis",
    color: "teal",
    products: [
      { name: "Sosis Kanzler Singles", sub: "Sosis daging", price: "Rp 9.000" },
      { name: "Sosis Kanzler Singles Hot", sub: "Sosis daging pedas", price: "Rp 9.000" },
      { name: "Sosis Kanzler Singles Keju", sub: "Sosis daging dengan Keju", price: "Rp 9.000" },
    ],
  },
];

type ColorKey = "blue" | "amber" | "coral" | "teal";

const colorMap: Record<ColorKey, {
  emoji: string;
  tag: string;
  dot: string;
  price: string;
  divider: string;
  chevron: string;
  activeBorder: string;
  activeHeaderBg: string;
}> = {
  blue: {
    emoji: "bg-blue-50",
    tag: "bg-blue-200 text-blue-900",
    dot: "bg-blue-400",
    price: "text-blue-700",
    divider: "bg-blue-100",
    chevron: "text-blue-400",
    activeBorder: "border-blue-200",
    activeHeaderBg: "bg-blue-50/50",
  },
  amber: {
    emoji: "bg-amber-50",
    tag: "bg-amber-200 text-amber-900",
    dot: "bg-amber-500",
    price: "text-amber-800",
    divider: "bg-amber-100",
    chevron: "text-amber-400",
    activeBorder: "border-amber-200",
    activeHeaderBg: "bg-amber-50/50",
  },
  coral: {
    emoji: "bg-orange-50",
    tag: "bg-orange-200 text-orange-900",
    dot: "bg-orange-500",
    price: "text-orange-800",
    divider: "bg-orange-100",
    chevron: "text-orange-400",
    activeBorder: "border-orange-200",
    activeHeaderBg: "bg-orange-50/50",
  },
  teal: {
    emoji: "bg-teal-50",
    tag: "bg-teal-200 text-teal-900",
    dot: "bg-teal-500",
    price: "text-teal-700",
    divider: "bg-teal-100",
    chevron: "text-teal-400",
    activeBorder: "border-teal-200",
    activeHeaderBg: "bg-teal-50/50",
  },
};

type Product = { name: string; sub: string; price: string };
type Category = (typeof categories)[0];

function getMinPrice(products: Product[]) {
  const prices = products.map((p) => parseInt(p.price.replace(/\D/g, ""), 10));
  const min = Math.min(...prices);
  return `Rp ${min.toLocaleString("id-ID")}`;
}

function ProductCard({
  category,
  delay,
  isOpen,
  onToggle,
}: {
  category: Category;
  delay: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const { ref, visible } = useReveal();
  const c = colorMap[category.color as ColorKey];

  return (
    <div
      ref={ref}
      className={`
        border rounded-2xl bg-white overflow-hidden
        transition-all duration-300 cursor-pointer select-none
        active:scale-[0.99]
        ${isOpen
          ? `${c.activeBorder} shadow-md`
          : "border-slate-100 hover:border-slate-200 hover:shadow-md hover:shadow-slate-100/60"
        }
      `}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms, box-shadow 0.3s, border-color 0.3s`,
      }}
      onClick={onToggle}
    >
      {/* Header */}
      <div className={`p-4 sm:p-5 transition-colors duration-200 ${isOpen ? c.activeHeaderBg : ""}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 sm:w-11 sm:h-11 lg:w-17 lg:h-35 rounded-xl flex items-center justify-center text-xl sm:text-2xl lg:text-5xl flex-shrink-0 ${c.emoji}`}
            >
              {category.emoji}
            </div>
            <div>
              <span className={`inline-block text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full mb-1.5 ${c.tag}`}>
                {category.tag}
              </span>
              <div className="text-[13px] sm:text-lg lg:text-xl font-bold  leading-snug mb-2">
                {category.name}
              </div>
              <div className=" font-semibold text-slate-400 mt-0.5">
                <p className="text-[11px] sm:text-[13px] text-slate-400">
                  Mulai Dari
                </p>
                <p className="text-blue-500 font-bold text-sm sm:text-base">
                  {getMinPrice(category.products)}
                </p>
              </div>
            </div>
          </div>

          {/* Chevron */}
          <div
            className={`flex-shrink-0 mt-1 transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"} ${c.chevron}`}
          >
            <ChevronDown size={16} />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className={`h-px transition-opacity duration-200 ${c.divider} ${isOpen ? "opacity-100" : "opacity-0"}`} />

      {/* Expandable product list */}
      <div
        className={`
          overflow-hidden
          transition-all duration-[380ms] ease-[cubic-bezier(0.4,0,0.2,1)]
          ${isOpen ? "max-h-[220px] opacity-100" : "max-h-0 opacity-0"}
        `}
      >
        <div
          className="max-h-[210px] overflow-y-auto px-4 sm:px-5 py-2.5 flex flex-col
            scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent"
          onClick={(e) => e.stopPropagation()}
        >
          {category.products.map((product, i) => (
            <div
              key={product.name}
              className={`flex items-center justify-between gap-2 py-1.5 ${
                i < category.products.length - 1 ? "border-b border-slate-50" : ""
              }`}
            >
              <div className="flex items-start gap-2 min-w-0">
                <span className={`w-1.5 h-1.5 rounded-full mt-[5px] flex-shrink-0 ${c.dot}`} />
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold text-slate-800 truncate">
                    {product.name}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{product.sub}</div>
                </div>
              </div>
              <span className={`text-[11px] font-bold flex-shrink-0 ${c.price}`}>
                {product.price}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Products() {
  const { ref, visible } = useReveal();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleToggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section id="products" className="py-16 sm:py-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div
          ref={ref}
          className="flex flex-wrap justify-between items-end gap-4 mb-3 sm:mb-6"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}
        >
          <div>
            <SectionChip>
              <Boxes size={14} /> Produk Kami
            </SectionChip>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight tracking-tight">
              Apa yang Kami Jual
            </h2>
             <div className="text-slate-400 py-3 px-1">
              Produk ini dapat anda beli di mesin vendo terdekat.
            </div>
          </div>
          <a
            href="#contact"
            className="text-sm font-bold text-blue-600 border-2 border-blue-200 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full hover:bg-blue-50 hover:border-blue-400 transition-all"
          >
            Request Produk →
          </a>
        </div>

        {/* Grid: 1 col mobile, 2 col tablet, 4 col desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
          {categories.map((cat, i) => (
            <ProductCard
              key={cat.name}
              category={cat}
              delay={i * 80}
              isOpen={openIndex === i}
              onToggle={() => handleToggle(i)}
            />
          ))}
        </div>  
        <h2 className="text-2xl font-bold text-slate-900 mb-4 px-3">Produk Populer</h2>
        <div className="grid grid-col-1 sm:grid-cols-3 lg:grid-cols-3 gap-4">
          <div className="border rounded-2xl bg-white overflow-hidden
          transition-all duration-300 cursor-pointer select-none
          ">
            <div className="p-5">
              <div className="flex items-center gap-2">
                <div className="rounded-full">
                  <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS2_fq4lpPGQ8NAXmQHvM856qEsBfp30uOzhQ&s" alt="Cocacola" className="w-25 h-15 object-contain"/>
                </div>
                <div>
                  <p className="font-bold text-sm">
                    Le Minerale
                  </p>
                  <p className="font-bold text-blue-500">
                    Rp 3.000
                  </p>
                  </div>
              </div>
            </div>
          </div>
          <div className="border rounded-2xl bg-white overflow-hidden
          transition-all duration-300 cursor-pointer select-none
          ">
            <div className="p-5">
              <div className="flex items-center gap-2">
                <div className="rounded-full">
                  <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRKoa111xMXz32IDmZ9amH2bjJO3gGnbntyHg&s" alt="Cocacola" className="w-25 h-15 object-contain"/>
                </div>
                <div>
                  <p className="font-bold text-sm">
                    Lays
                  </p>
                  <p className="font-bold text-blue-500">
                    Rp 6.000
                  </p>
                  </div>
              </div>
            </div>
          </div>
          <div className="border rounded-2xl bg-white overflow-hidden
          transition-all duration-300 cursor-pointer select-none
          ">
            <div className="p-5">
              <div className="flex items-center gap-2">
                <div className="rounded-full">
                  <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS4CnIanbWQhieX2eXj2xaglhaw7iKIOEi_Ww&s" alt="Cocacola" className="w-25 h-15 object-contain"/>
                </div>
                <div>
                  <p className="font-bold text-sm">
                    Garuda Rosta
                  </p>
                  <p className="font-bold text-blue-500">
                    Rp 6.000
                  </p>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}