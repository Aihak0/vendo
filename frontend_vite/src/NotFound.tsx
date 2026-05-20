import Logo from './assets/LogoDark.png';

// Floating particle dots
function Particles() {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    size: Math.random() * 6 + 3,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 6 + 5,
    delay: Math.random() * 4,
    opacity: Math.random() * 0.4 + 0.1,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-blue-400"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            opacity: p.opacity,
            animation: `floatParticle ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// Orbiting rings around the astronaut
function OrbitRings() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div
        className="absolute w-72 h-72 rounded-full border border-blue-200/40"
        style={{ animation: "spinSlow 18s linear infinite" }}
      />
      <div
        className="absolute w-96 h-96 rounded-full border border-blue-100/30"
        style={{ animation: "spinSlow 28s linear infinite reverse" }}
      />
      <div
        className="absolute w-[28rem] h-[28rem] rounded-full border border-dashed border-blue-200/20"
        style={{ animation: "spinSlow 40s linear infinite" }}
      />
    </div>
  );
}

export default function NotFound() {
  return (
    <>
      <style>{`
        @keyframes floatAstronaut {
          0%, 100% { transform: translateY(0px) rotate(-3deg); }
          50%       { transform: translateY(-22px) rotate(3deg); }
        }
        @keyframes floatParticle {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: inherit; }
          33%       { transform: translateY(-14px) translateX(8px); }
          66%       { transform: translateY(8px) translateX(-6px); }
        }
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes pulseSoft {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.06); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes numberPop {
          0%   { opacity: 0; transform: scale(0.6) translateY(20px); }
          70%  { transform: scale(1.06) translateY(-4px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .anim-fadeslide-1 { animation: fadeSlideUp 0.7s ease 0.1s both; }
        .anim-fadeslide-2 { animation: fadeSlideUp 0.7s ease 0.25s both; }
        .anim-fadeslide-3 { animation: fadeSlideUp 0.7s ease 0.4s both; }
        .anim-fadeslide-4 { animation: fadeSlideUp 0.7s ease 0.55s both; }
        .anim-number      { animation: numberPop 0.8s cubic-bezier(0.34,1.56,0.64,1) 0.05s both; }
      `}</style>

      <div className="relative min-h-screen bg-[#f8faff] flex flex-col items-center justify-center overflow-hidden px-6">
        {/* Background blobs */}
        <div className="absolute top-[-80px] right-[-60px] w-[420px] h-[420px] rounded-full bg-blue-200/35 blur-[90px] pointer-events-none" />
        <div className="absolute bottom-[-60px] left-[-60px] w-[350px] h-[350px] rounded-full bg-blue-100/50 blur-[80px] pointer-events-none" />

        {/* Floating particles */}
        <Particles />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-lg w-full">

          {/* Orbit rings + Astronaut */}
          <div className="relative w-64 h-40 flex items-center justify-center mb-6">
            <OrbitRings />

            {/* Glow behind astronaut */}
            <div
              className="absolute w-36 h-36 rounded-full bg-blue-300/30 blur-2xl"
              style={{ animation: "pulseSoft 3.5s ease-in-out infinite" }}
            />

            {/* Astronaut illustration */}
            <div
              className="relative z-10 w-36 h-36 bg-gradient-to-br from-white to-blue-50
                border-2 border-blue-100 rounded-full flex items-center justify-center
                shadow-2xl shadow-blue-200/50"
              style={{ animation: "floatAstronaut 5s ease-in-out infinite" }}
            >
              {/* Helmet */}
              <div className="relative w-30 h-30 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center border-4 border-white shadow-inner">
                <div className="absolute top-3 right-4 w-4 h-3 bg-white/60 rounded-full blur-[1px] " />
                {/* Visor */}
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-md z-1">
                  <div className="w-5 h-4 bg-white/30 rounded-full blur-[2px]" />
                  <img src={Logo} alt="logo" className='-rotate-50'/>
                </div>
                <div className='absolute left-5 top-6 h-3 w-7 bg-blue-400 rounded-full rotate-67'/>
                <div className='absolute right-2 top-17 h-3 w-7 bg-blue-600 rounded-full rotate-10'/>
                <div className='absolute left-8 bottom-4 h-3 w-7 bg-blue-500 rounded-full rotate-110'/>
                <div className='absolute left-4 bottom-6 h-3 w-7 bg-blue-500 rounded-full rotate-140'/>
                {/* Highlight */}
              </div>

              {/* Stars floating around helmet */}
              <span className="absolute -top-1 -right-1 text-base animate-[pulseSoft_2s_ease-in-out_0.3s_infinite]">⭐</span>
              <span className="absolute -bottom-1 -left-2 text-sm animate-[pulseSoft_2.5s_ease-in-out_0.8s_infinite]">✨</span>
              <span className="absolute top-1 -left-3 text-xs animate-[pulseSoft_2s_ease-in-out_1.2s_infinite]">💫</span>
            </div>
          </div>

          {/* 404 number */}
          <div className="anim-number mb-2">
            <span className="text-[7rem] sm:text-[9rem] font-black leading-none tracking-tighter bg-gradient-to-br from-blue-400 via-blue-500 to-blue-700 bg-clip-text text-transparent select-none">
              404
            </span>
          </div>

          {/* Title */}
          <h1 className="anim-fadeslide-1 text-2xl sm:text-3xl font-black text-slate-800 tracking-tight mb-3">
            Halaman Tidak Ditemukan
          </h1>

          {/* Subtitle */}
          <p className="anim-fadeslide-2 text-slate-500 text-base leading-relaxed mb-8 max-w-xs">
            Ups! Sepertinya kamu tersesat di luar angkasa.
          </p>

          {/* Divider dots */}
          <div className="anim-fadeslide-3 flex gap-2 mb-8">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-blue-300"
                style={{ animation: `pulseSoft 1.5s ease-in-out ${i * 0.2}s infinite` }}
              />
            ))}
          </div>

          {/* CTA Button */}
          <a
            href="/"
            className="anim-fadeslide-4 group inline-flex items-center gap-2.5
              bg-gradient-to-r from-blue-500 to-blue-700 text-white
              font-bold text-sm px-6 py-2 rounded-full
              shadow-lg shadow-blue-300/40
              hover:shadow-blue-400/50 hover:-translate-y-1
              transition-all duration-300"
          >
            <span
              className="text-sm transition-transform duration-300 group-hover:-translate-x-1"
            >
              🚀
            </span>
            Kembali ke Beranda
          </a>
        </div>

        {/* Bottom brand */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
          <a href="/" className="flex items-center gap-1.5 opacity-50 hover:opacity-80 transition-opacity">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span className="font-black text-sm text-blue-600">
              vendo
            </span>
          </a>
        </div>
      </div>
    </>
  );
}