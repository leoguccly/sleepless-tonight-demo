"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LandingPage() {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleEnter = () => {
    setIsTransitioning(true);
    setTimeout(() => router.push("/dashboard"), 600);
  };

  return (
    <div
      className={`fixed inset-0 bg-slate-950 overflow-hidden flex flex-col items-center justify-center transition-opacity duration-600 ${
        isTransitioning ? "opacity-0 scale-105" : "opacity-100 scale-100"
      }`}
      style={{ transition: "opacity 0.6s ease, transform 0.6s ease" }}
    >
      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none z-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
        }}
      />

      {/* Ambient glow orbs */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-rose-900/[0.06] blur-[150px] animate-breathe" />
        <div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-amber-900/[0.04] blur-[130px] animate-breathe"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-pink-900/[0.05] blur-[100px] animate-breathe"
          style={{ animationDelay: "4s" }}
        />
      </div>

      {/* Glassmorphism backdrop layer */}
      <div className="absolute inset-0 backdrop-blur-[1px] z-[1]" />

      {/* SVG line art - abstract flowing feminine curves */}
      <svg
        className="absolute inset-0 w-full h-full z-[2] pointer-events-none"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <defs>
          <linearGradient id="line-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5C4B8" stopOpacity="0" />
            <stop offset="30%" stopColor="#F5C4B8" stopOpacity="0.12" />
            <stop offset="70%" stopColor="#E8B4A6" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#F5C4B8" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="line-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D4A99A" stopOpacity="0" />
            <stop offset="25%" stopColor="#D4A99A" stopOpacity="0.1" />
            <stop offset="75%" stopColor="#E8C4B8" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#D4A99A" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="line-grad-3" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#F0D5CC" stopOpacity="0" />
            <stop offset="40%" stopColor="#F0D5CC" stopOpacity="0.07" />
            <stop offset="60%" stopColor="#E0BFB3" stopOpacity="0.09" />
            <stop offset="100%" stopColor="#F0D5CC" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Primary flowing curve - S-shape torso silhouette */}
        <path
          d="M 200,900 C 250,750 180,650 280,550 C 380,450 300,380 350,280 C 400,180 320,120 380,50"
          stroke="url(#line-grad-1)"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="animate-line-draw-1"
          style={{ filter: "blur(0.5px)" }}
        />

        {/* Secondary curve - shoulder/hip flow */}
        <path
          d="M 600,950 C 580,800 650,700 620,580 C 590,460 670,380 640,260 C 610,140 680,80 650,20"
          stroke="url(#line-grad-2)"
          strokeWidth="1"
          strokeLinecap="round"
          className="animate-line-draw-2"
          style={{ filter: "blur(0.3px)" }}
        />

        {/* Tertiary accent curve - gentle arc */}
        <path
          d="M 100,500 C 200,450 350,480 450,420 C 550,360 650,390 800,340"
          stroke="url(#line-grad-3)"
          strokeWidth="0.8"
          strokeLinecap="round"
          className="animate-line-draw-3"
          style={{ filter: "blur(0.3px)" }}
        />

        {/* Fourth curve - lower body flow */}
        <path
          d="M 400,980 C 420,850 350,780 400,680 C 450,580 380,500 430,400 C 480,300 420,220 470,120"
          stroke="url(#line-grad-1)"
          strokeWidth="0.6"
          strokeLinecap="round"
          className="animate-line-draw-4"
          style={{ filter: "blur(0.5px)" }}
        />

        {/* Fifth curve - delicate wisp */}
        <path
          d="M 750,800 C 700,700 780,620 720,520 C 660,420 740,350 700,250"
          stroke="url(#line-grad-3)"
          strokeWidth="0.5"
          strokeLinecap="round"
          className="animate-line-draw-5"
          style={{ filter: "blur(0.4px)" }}
        />
      </svg>

      {/* Content layer */}
      <div className="relative z-20 flex flex-col items-center justify-center text-center px-6">
        {/* Main title */}
        <h1
          className="font-serif text-5xl sm:text-6xl md:text-7xl text-white/90 tracking-[0.5em] mb-6 animate-text-breathe select-none"
          style={{ textShadow: "0 0 40px rgba(255,200,195,0.15), 0 0 80px rgba(255,200,195,0.05)" }}
        >
          今夜不眠
        </h1>

        {/* Decorative line under title */}
        <div className="w-24 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-6 animate-fade-in-slow" />

        {/* Subtitle */}
        <p className="text-white/25 text-sm sm:text-base tracking-[0.3em] font-light mb-20 animate-fade-in-slow" style={{ animationDelay: "1s" }}>
          在線條與光影間，探索私密
        </p>

        {/* Enter button */}
        <button
          onClick={handleEnter}
          className="group relative px-10 py-4 rounded-2xl overflow-hidden transition-all duration-500 ease-out hover:scale-[1.03] active:scale-[0.98] animate-fade-in-slow cursor-pointer"
          style={{ animationDelay: "1.6s" }}
        >
          {/* Button glass background */}
          <div className="absolute inset-0 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl transition-all duration-500 group-hover:bg-white/[0.08] group-hover:border-white/[0.15]" />
          {/* Button top highlight */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent group-hover:via-white/25 transition-all duration-500" />
          {/* Button glow on hover */}
          <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ boxShadow: "inset 0 0 30px rgba(255,200,195,0.03), 0 0 40px rgba(255,200,195,0.05)" }} />

          <span className="relative text-white/60 text-sm tracking-[0.35em] font-light group-hover:text-white/80 transition-colors duration-500">
            進入空間
          </span>
        </button>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent z-[3] pointer-events-none" />
    </div>
  );
}
