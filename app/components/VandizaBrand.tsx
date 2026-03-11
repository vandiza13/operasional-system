'use client'

/**
 * VandizaBrand — Komponen Branding Elegan
 * Menampilkan footer branding oleh vandiza (www.vandiza.my.id)
 * 
 * Props:
 * - compact: boolean — mode kecil untuk sidebar (default: false)
 */
export default function VandizaBrand({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="group flex flex-col items-center gap-2 py-3 transition-all duration-500">
        {/* Separator */}
        <div className="w-8 h-px bg-slate-800 group-hover:w-12 group-hover:bg-indigo-500/50 transition-all duration-500" />

        {/* Compact Badge */}
        <a
          href="https://www.vandiza.my.id"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 opacity-40 group-hover:opacity-80 transition-all duration-500"
        >
          {/* Mini Logo */}
          <div className="w-5 h-5 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-md flex items-center justify-center shadow-sm group-hover:shadow-indigo-500/30 group-hover:scale-110 transition-all duration-500">
            <span className="text-[9px] font-black text-white leading-none">V</span>
          </div>
          <span className="text-[10px] font-bold text-slate-500 group-hover:text-indigo-400 tracking-wider transition-colors duration-300">
            vandiza
          </span>
        </a>
      </div>
    );
  }

  return (
    <div className="group flex flex-col items-center gap-3 py-4 transition-all duration-500">
      {/* Decorative Separator */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-px bg-slate-700/50 group-hover:w-12 group-hover:bg-indigo-500/30 transition-all duration-700" />
        <div className="w-1.5 h-1.5 bg-slate-700 rounded-full group-hover:bg-indigo-500/50 transition-all duration-500" />
        <div className="w-8 h-px bg-slate-700/50 group-hover:w-12 group-hover:bg-indigo-500/30 transition-all duration-700" />
      </div>

      {/* Main Brand Block */}
      <div className="flex items-center gap-3 opacity-50 group-hover:opacity-90 transition-all duration-500">
        {/* Logo Mark */}
        <div className="relative">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-indigo-500/40 group-hover:scale-110 transition-all duration-500">
            <span className="text-xs font-black text-white leading-none tracking-tight">V</span>
          </div>
          {/* Glow Effect */}
          <div className="absolute inset-0 w-8 h-8 bg-indigo-500/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        </div>

        {/* Text Block */}
        <div className="flex flex-col">
          <span className="text-[11px] font-medium text-slate-500 leading-tight group-hover:text-slate-400 transition-colors duration-300">
            Crafted by{' '}
            <a
              href="https://www.vandiza.my.id"
              target="_blank"
              rel="noopener noreferrer"
              className="font-extrabold text-slate-400 group-hover:text-indigo-400 transition-colors duration-300 hover:underline hover:underline-offset-2"
            >
              vandiza
            </a>
          </span>
          <span className="text-[8px] font-bold text-slate-600 uppercase tracking-[0.2em] group-hover:text-slate-500 transition-colors duration-300">
            Digital Solutions
          </span>
        </div>
      </div>

      {/* Copyright */}
      <p className="text-[10px] text-slate-600 font-medium tracking-wide group-hover:text-slate-500 transition-colors duration-300">
        © 2026 ·{' '}
        <a
          href="https://www.vandiza.my.id"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-indigo-400 transition-colors duration-300 cursor-pointer"
        >
          vandiza
        </a>
      </p>
    </div>
  );
}
