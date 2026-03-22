const stats = [
  { num: "50+", label: "Varian Produk" },
  { num: "24/7", label: "Operasional" },
  { num: "12+", label: "Lokasi Aktif" },
  { num: "5K+", label: "Pelanggan Puas" },
];

export default function StatsBar() {
  return (
    <div className="bg-white border-y border-blue-100 py-8 px-6">
      <div className="max-w-4xl mx-auto flex flex-wrap justify-around gap-6">
        {stats.map((s, i) => (
          <div key={s.label} className="flex items-center gap-6">
            <div className="text-center">
              <p className="font-black text-3xl bg-gradient-to-br from-blue-500 to-blue-700 bg-clip-text text-transparent leading-none">
                {s.num}
              </p>
              <p className="text-xs font-semibold text-slate-400 mt-1">{s.label}</p>
            </div>
            {i < stats.length - 1 && (
              <div className="hidden sm:block w-px h-10 bg-blue-100" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
