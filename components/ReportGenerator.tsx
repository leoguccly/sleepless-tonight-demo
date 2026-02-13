"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import html2canvas from "html2canvas";
import {
  X,
  Download,
  Loader2,
  Flame,
  Heart,
  TrendingUp,
  Zap,
  Award,
  Star,
  Crown,
  Shield,
  Sparkles,
} from "lucide-react";

interface AnalyticsData {
  entries: { date: string; score: number; duration: number; mode: string; partner: string | null }[];
  emotions: Record<string, number>;
  modeCount: { partner: number; solo: number };
  summary: { total: number; avg: number; maxStreak: number };
}

// 根據數據計算勳章等級
function getBadge(data: AnalyticsData) {
  const { total, avg } = data.summary;
  const score = total * 2 + avg * 5;

  if (score >= 80) return { level: "SSS", title: "傳奇探索者", color: "from-amber-300 via-yellow-400 to-amber-500", icon: <Crown className="w-8 h-8" />, desc: "親密關係的絕對王者" };
  if (score >= 60) return { level: "SS", title: "卓越達人", color: "from-violet-400 via-purple-500 to-fuchsia-500", icon: <Award className="w-8 h-8" />, desc: "探索的深度令人驚嘆" };
  if (score >= 40) return { level: "S", title: "活躍先鋒", color: "from-primary via-rose-400 to-pink-500", icon: <Zap className="w-8 h-8" />, desc: "保持穩定的高品質紀錄" };
  if (score >= 20) return { level: "A", title: "成長新星", color: "from-sky-400 via-cyan-400 to-teal-400", icon: <Star className="w-8 h-8" />, desc: "在探索的路上穩步前進" };
  return { level: "B", title: "初心冒險者", color: "from-emerald-400 via-green-400 to-lime-400", icon: <Shield className="w-8 h-8" />, desc: "旅程才剛剛開始" };
}

// 迷你趨勢圖 - 用 div 畫 bar chart
function MiniChart({ entries }: { entries: AnalyticsData["entries"] }) {
  const recent = entries.slice(-14);
  if (recent.length === 0) return null;
  const maxScore = 10;

  return (
    <div className="flex items-end gap-[3px] h-[80px] w-full">
      {recent.map((e, i) => {
        const h = (e.score / maxScore) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-t-sm transition-all"
              style={{
                height: `${h}%`,
                background: e.mode === "partner"
                  ? "linear-gradient(to top, rgba(255,136,130,0.6), rgba(255,136,130,0.9))"
                  : "linear-gradient(to top, rgba(139,92,246,0.5), rgba(139,92,246,0.8))",
              }}
            />
            {i % 3 === 0 && (
              <span className="text-[6px] text-white/30 tabular-nums">
                {e.date.slice(5)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ReportGenerator({ onClose }: { onClose: () => void }) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetch("/api/analytics?range=year")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleDownload = useCallback(async () => {
    if (!reportRef.current) return;
    setGenerating(true);

    try {
      // 等待渲染完成
      await new Promise((r) => setTimeout(r, 300));

      const el = reportRef.current;
      const canvas = await html2canvas(el, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false,
        width: el.scrollWidth,
        height: el.scrollHeight,
        windowWidth: el.scrollWidth,
        windowHeight: el.scrollHeight,
      });

      const link = document.createElement("a");
      link.download = "Sex_Report_2026.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Generate Error:", err);
    } finally {
      setGenerating(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-xl flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center gap-4">
        <p className="text-slate-400">無法載入資料</p>
        <button onClick={onClose} className="text-primary text-sm">關閉</button>
      </div>
    );
  }

  const badge = getBadge(data);
  const topEmotions = Object.entries(data.emotions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const totalMode = data.modeCount.partner + data.modeCount.solo;
  const partnerPct = totalMode > 0 ? Math.round((data.modeCount.partner / totalMode) * 100) : 0;
  const totalDuration = data.entries.reduce((s, e) => s + e.duration, 0);
  const avgDuration = data.entries.length > 0 ? Math.round(totalDuration / data.entries.length) : 0;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <button onClick={onClose} className="p-2 rounded-xl bg-white/[0.06] text-white">
          <X className="w-5 h-5" />
        </button>
        <span className="text-sm font-semibold text-white">親密報告預覽</span>
        <button
          onClick={handleDownload}
          disabled={generating}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-rose-500 text-white text-sm font-semibold disabled:opacity-50"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {generating ? "生成中..." : "下載"}
        </button>
      </div>

      {/* Scrollable preview */}
      <div className="flex-1 overflow-y-auto flex justify-center items-start px-4 py-6">
        {/* ========== REPORT CANVAS ========== */}
        <div
          ref={reportRef}
          className="relative"
          style={{
            width: "360px",
            minHeight: "640px",
            height: "auto",
            background: "linear-gradient(170deg, #0c0c20 0%, #0a0e27 30%, #120a1c 60%, #0a0a1a 100%)",
            borderRadius: "24px",
            border: "1px solid rgba(255,136,130,0.15)",
            overflow: "hidden",
          }}
        >
          {/* Decorative glow orbs */}
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-primary/[0.08] blur-[80px]" />
          <div className="absolute -bottom-32 -left-20 w-72 h-72 rounded-full bg-violet-600/[0.06] blur-[80px]" />
          <div className="absolute top-1/3 right-0 w-40 h-40 rounded-full bg-rose-500/[0.05] blur-[60px]" />

          {/* Content */}
          <div className="relative z-10 p-6 pb-8 flex flex-col">

            {/* ──── Header ──── */}
            <div className="text-center mb-5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/[0.12] border border-primary/20 mb-3">
                <Sparkles className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-bold text-primary tracking-wider">2026 年度報告</span>
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight mb-1">
                親密 <span style={{ background: "linear-gradient(90deg, #ff8882, #f97066)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>數據總覽</span>
              </h1>
              <p className="text-[11px] text-slate-500">Project Pleasure · 你的專屬報告</p>
            </div>

            {/* ──── Stats Grid ──── */}
            <div
              className="grid grid-cols-3 gap-2 mb-4"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "16px",
                padding: "14px 10px",
              }}
            >
              <div className="text-center">
                <div className="flex justify-center mb-1.5">
                  <Flame className="w-4 h-4 text-primary" />
                </div>
                <div className="text-xl font-extrabold text-white tabular-nums">{data.summary.total}</div>
                <div className="text-[9px] text-slate-500 font-medium">活動總次數</div>
              </div>
              <div className="text-center" style={{ borderLeft: "1px solid rgba(255,255,255,0.06)", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex justify-center mb-1.5">
                  <Heart className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-xl font-extrabold text-white tabular-nums">{data.summary.avg}</div>
                <div className="text-[9px] text-slate-500 font-medium">平均滿意度</div>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-xl font-extrabold text-white tabular-nums">{data.summary.maxStreak}</div>
                <div className="text-[9px] text-slate-500 font-medium">最長連續天</div>
              </div>
            </div>

            {/* ──── Trend Chart ──── */}
            <div
              className="mb-4"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "16px",
                padding: "14px",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-slate-300">滿意度趨勢</span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-[8px] text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-primary inline-block" /> 伴侶
                  </span>
                  <span className="flex items-center gap-1 text-[8px] text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" /> 獨自
                  </span>
                </div>
              </div>
              <MiniChart entries={data.entries} />
            </div>

            {/* ──── Mode + Emotion Row ──── */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {/* Mode */}
              <div
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "14px",
                  padding: "12px",
                }}
              >
                <span className="text-[10px] font-semibold text-slate-400 block mb-2">模式分佈</span>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${partnerPct}%`,
                        background: "linear-gradient(90deg, #ff8882, #f97066)",
                      }}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-[9px]">
                  <span className="text-primary font-medium">伴侶 {partnerPct}%</span>
                  <span className="text-violet-400 font-medium">獨自 {100 - partnerPct}%</span>
                </div>
              </div>
              {/* Time */}
              <div
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "14px",
                  padding: "12px",
                }}
              >
                <span className="text-[10px] font-semibold text-slate-400 block mb-2">時間統計</span>
                <div className="text-lg font-extrabold text-white tabular-nums">{totalDuration}</div>
                <div className="text-[9px] text-slate-500">總分鐘數 · 平均 {avgDuration} 分鐘/次</div>
              </div>
            </div>

            {/* ──── Top Emotions ──── */}
            {topEmotions.length > 0 && (
              <div
                className="mb-4"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "14px",
                  padding: "12px",
                }}
              >
                <span className="text-[10px] font-semibold text-slate-400 block mb-2">最常出現的情緒</span>
                <div className="flex flex-wrap gap-1.5 overflow-hidden" style={{ maxHeight: "60px" }}>
                  {topEmotions.slice(0, 5).map(([emoji, count]) => (
                    <span
                      key={emoji}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        color: "#cbd5e1",
                      }}
                    >
                      {emoji}
                      <span className="text-slate-500 tabular-nums">{count}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ──── Badge ──── */}
            <div className="flex items-center justify-center py-4">
              <div className="text-center">
                {/* Outer glow ring */}
                <div className="relative inline-flex items-center justify-center mb-3">
                  <div
                    className="absolute inset-0 rounded-full blur-xl opacity-40"
                    style={{ background: `linear-gradient(135deg, ${badge.color.includes("amber") ? "#fbbf24" : badge.color.includes("violet") ? "#8b5cf6" : badge.color.includes("primary") ? "#ff8882" : badge.color.includes("sky") ? "#38bdf8" : "#34d399"}, transparent)` }}
                  />
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center text-white relative"
                    style={{
                      background: `linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))`,
                      border: "2px solid rgba(255,136,130,0.3)",
                      boxShadow: "0 0 30px rgba(255,136,130,0.15), inset 0 0 20px rgba(255,255,255,0.03)",
                    }}
                  >
                    <div className="text-center">
                      <div className="text-2xl font-black tracking-tight" style={{ background: `linear-gradient(135deg, ${badge.color.includes("amber") ? "#fbbf24, #f59e0b" : badge.color.includes("violet") ? "#a78bfa, #c084fc" : badge.color.includes("primary") ? "#ff8882, #fb7185" : badge.color.includes("sky") ? "#38bdf8, #2dd4bf" : "#34d399, #a3e635"})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        {badge.level}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-sm font-bold text-white mb-0.5">{badge.title}</div>
                <div className="text-[10px] text-slate-500">{badge.desc}</div>
              </div>
            </div>

            {/* ──── Footer ──── */}
            <div className="text-center pt-2 pb-1">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <div className="w-1 h-1 rounded-full bg-primary" />
                <span className="text-[9px] font-semibold tracking-widest" style={{ background: "linear-gradient(90deg, #ff8882, #f97066)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  PROJECT PLEASURE
                </span>
                <div className="w-1 h-1 rounded-full bg-primary" />
              </div>
              <p className="text-[8px] text-slate-600">隱私至上 · 科學導向 · 正向設計</p>
            </div>
          </div>

          {/* Coral-pink gradient border glow (top + bottom) */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-rose-400/30 to-transparent" />
          <div className="absolute top-0 bottom-0 left-0 w-[1px] bg-gradient-to-b from-primary/20 via-transparent to-rose-400/20" />
          <div className="absolute top-0 bottom-0 right-0 w-[1px] bg-gradient-to-b from-rose-400/20 via-transparent to-primary/20" />
        </div>
      </div>
    </div>
  );
}
