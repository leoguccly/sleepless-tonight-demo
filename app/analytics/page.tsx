"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/layout/BottomNav";
import { ArrowLeft, TrendingUp, Heart, Flame, Zap, Users, User } from "lucide-react";

interface ChartEntry {
  date: string;
  score: number;
  duration: number;
  mode: string;
  partner: string | null;
}

interface AnalyticsData {
  entries: ChartEntry[];
  emotions: Record<string, number>;
  modeCount: { partner: number; solo: number };
  summary: { total: number; avg: number; maxStreak: number };
}

const RANGES = [
  { key: "week", label: "週" },
  { key: "month", label: "月" },
  { key: "year", label: "年" },
];

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [range, setRange] = useState("month");

  useEffect(() => {
    fetchAnalytics(range);
  }, [range]);

  const fetchAnalytics = async (r: string) => {
    const res = await fetch(`/api/analytics?range=${r}`);
    const json = await res.json();
    if (json.success) setData(json.data);
  };

  const maxScore = 10;
  const mockEntries: ChartEntry[] = [
    { date: "2026-01-01", score: 7, duration: 30, mode: "partner", partner: "A" },
    { date: "2026-01-05", score: 8, duration: 45, mode: "solo", partner: null },
    { date: "2026-01-10", score: 6, duration: 20, mode: "partner", partner: "A" },
    { date: "2026-01-15", score: 9, duration: 60, mode: "solo", partner: null },
    { date: "2026-01-20", score: 7.5, duration: 35, mode: "partner", partner: "A" },
  ];
  const rawEntries = data?.entries || [];
  const chartEntries = rawEntries.length > 0 ? rawEntries : mockEntries;
  const isUsingMock = rawEntries.length === 0;
  const emotions = data?.emotions || {};
  const sortedEmotions = Object.entries(emotions).sort((a, b) => b[1] - a[1]);
  const maxEmotionCount = sortedEmotions.length > 0 ? sortedEmotions[0][1] : 1;

  return (
    <div className="min-h-screen bg-[#0f172a] pb-28">
      {/* Header */}
      <header className="sticky top-0 z-50 px-6 py-4 bg-[#0f172a]/80 backdrop-blur-2xl border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-xl hover:bg-white/[0.06] transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <h1 className="text-base font-bold text-white">數據分析</h1>
          <div className="w-9" />
        </div>
      </header>

      <div className="px-6 pt-5">
        {/* Range Tabs */}
        <div className="flex gap-2 mb-6">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 ${
                range === r.key
                  ? "bg-primary/[0.15] text-primary border border-primary/25 shadow-[0_0_12px_rgba(255,136,130,0.15)]"
                  : "bg-white/[0.03] text-slate-500 border border-white/[0.06] hover:bg-white/[0.06]"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Summary Cards */}
        {data && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="glass-card rounded-2xl p-4 text-center animate-fade-up">
              <Flame className="w-4 h-4 text-primary mx-auto mb-2" />
              <div className="text-2xl font-extrabold text-white tabular-nums">{data.summary.total}</div>
              <div className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider">活動次數</div>
            </div>
            <div className="glass-card rounded-2xl p-4 text-center animate-fade-up" style={{ animationDelay: "0.06s" }}>
              <Heart className="w-4 h-4 text-rose-400 mx-auto mb-2" />
              <div className="text-2xl font-extrabold text-white tabular-nums">{data.summary.avg}</div>
              <div className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider">平均分數</div>
            </div>
            <div className="glass-card rounded-2xl p-4 text-center animate-fade-up" style={{ animationDelay: "0.12s" }}>
              <Zap className="w-4 h-4 text-amber-400 mx-auto mb-2" />
              <div className="text-2xl font-extrabold text-white tabular-nums">{data.summary.maxStreak}天</div>
              <div className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider">最長連續</div>
            </div>
          </div>
        )}

        {/* Satisfaction Trend Chart */}
        <div className="glass-card rounded-2xl p-5 mb-6 animate-fade-up" style={{ animationDelay: "0.15s" }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-white">滿意度趨勢</h2>
          </div>

          {isUsingMock && (
            <div className="mb-3 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] inline-block">
              <span className="text-[10px] text-slate-500">範例數據 · 新增記錄後顯示真實數據</span>
            </div>
          )}
          <div className="relative">
            {/* Y axis labels */}
            <div className="absolute left-0 top-0 bottom-6 w-6 flex flex-col justify-between text-[9px] text-slate-700 font-mono">
              <span>10</span>
              <span>5</span>
              <span>0</span>
            </div>
            {/* Chart area */}
            <div className="ml-8">
              {/* Grid lines + Bars */}
              <div className="relative" style={{ height: "300px" }}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="absolute w-full h-px bg-white/[0.06]" style={{ top: `${i * 25}%` }} />
                ))}
                {/* Bars */}
                <div className="absolute inset-0 flex items-end gap-1 px-1">
                  {chartEntries.map((entry, idx) => {
                    const height = (entry.score / maxScore) * 100;
                    const isPartner = entry.mode === "partner";
                    return (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center justify-end group relative"
                      >
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                          <div className="glass-card rounded-lg px-2.5 py-1.5 text-[10px] whitespace-nowrap">
                            <div className="text-white font-semibold">{entry.score}/10</div>
                            <div className="text-slate-500">{entry.date}</div>
                          </div>
                        </div>
                        <div
                          className={`w-full rounded-t transition-all duration-500 ${isUsingMock ? "opacity-60" : "opacity-100"}`}
                          style={{
                            height: `${height}%`,
                            minHeight: "8px",
                            background: isPartner
                              ? "linear-gradient(to top, #f87171, #fb923c)"
                              : "linear-gradient(to top, #8b5cf6, #a78bfa)",
                          }}
                        />
                        {/* Date label for sparse data */}
                        {chartEntries.length <= 10 && (
                          <span className="text-[8px] text-slate-700 mt-1 truncate w-full text-center">
                            {entry.date.slice(5)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Legend */}
              <div className="flex items-center justify-center gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "#f87171" }} />
                  <span className="text-[10px] text-slate-500">伴侶</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "#8b5cf6" }} />
                  <span className="text-[10px] text-slate-500">獨自</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mode Distribution */}
        {data && data.summary.total > 0 && (
          <div className="glass-card rounded-2xl p-5 mb-6 animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <h2 className="text-sm font-bold text-white mb-4">模式分佈</h2>
            <div className="flex gap-3">
              <div className="flex-1 rounded-xl bg-primary/[0.08] border border-primary/[0.15] p-4 text-center">
                <Users className="w-5 h-5 text-primary mx-auto mb-2" />
                <div className="text-xl font-extrabold text-white tabular-nums">{data.modeCount.partner}</div>
                <div className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider">伴侶</div>
              </div>
              <div className="flex-1 rounded-xl bg-violet-500/[0.08] border border-violet-500/[0.15] p-4 text-center">
                <User className="w-5 h-5 text-violet-400 mx-auto mb-2" />
                <div className="text-xl font-extrabold text-white tabular-nums">{data.modeCount.solo}</div>
                <div className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider">獨自</div>
              </div>
            </div>
            {/* Bar */}
            <div className="flex h-2 rounded-full overflow-hidden mt-4">
              {data.modeCount.partner > 0 && (
                <div
                  className="bg-gradient-to-r from-primary to-rose-400 rounded-l-full"
                  style={{ width: `${(data.modeCount.partner / data.summary.total) * 100}%` }}
                />
              )}
              {data.modeCount.solo > 0 && (
                <div
                  className="bg-gradient-to-r from-violet-500 to-indigo-500 rounded-r-full"
                  style={{ width: `${(data.modeCount.solo / data.summary.total) * 100}%` }}
                />
              )}
            </div>
          </div>
        )}

        {/* Emotion Distribution */}
        {sortedEmotions.length > 0 && (
          <div className="glass-card rounded-2xl p-5 animate-fade-up" style={{ animationDelay: "0.25s" }}>
            <h2 className="text-sm font-bold text-white mb-4">情緒分佈</h2>
            <div className="space-y-3">
              {sortedEmotions.map(([emotion, count]) => (
                <div key={emotion} className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 font-medium w-16 truncate">{emotion}</span>
                  <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-rose-400 transition-all duration-500"
                      style={{ width: `${(count / maxEmotionCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 font-mono tabular-nums w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
