"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  TrendingUp,
  Heart,
  Flame,
  Clock,
  FileImage,
  Trash2,
  ChevronRight,
  Zap,
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import BottomNav from "@/components/layout/BottomNav";
import AddActivityModal from "@/components/tracker/AddActivityModal";
import ReportGenerator from "@/components/ReportGenerator";

interface Activity {
  id: string;
  activityDate: string;
  satisfactionScore: number;
  emotionTags: string;
  durationMinutes: number;
}

interface Stats {
  monthlyCount: number;
  avgSatisfaction: number;
}

interface ChartPoint {
  date: string;
  score: number;
}

const MOCK_CHART: ChartPoint[] = [
  { date: "1", score: 6 },
  { date: "2", score: 7.5 },
  { date: "3", score: 5 },
  { date: "4", score: 8 },
  { date: "5", score: 7 },
  { date: "6", score: 9 },
  { date: "7", score: 8.5 },
  { date: "8", score: 7 },
  { date: "9", score: 8 },
  { date: "10", score: 9.5 },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ monthlyCount: 0, avgSatisfaction: 0 });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [chartData, setChartData] = useState<ChartPoint[]>(MOCK_CHART);
  const [showModal, setShowModal] = useState(false);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchActivities();
    fetchChart();
  }, []);

  const fetchStats = async () => {
    const res = await fetch("/api/stats");
    const data = await res.json();
    if (data.success) setStats(data.data);
  };

  const fetchActivities = async () => {
    const res = await fetch("/api/activities");
    const data = await res.json();
    if (data.success) {
      const sorted = [...data.data].sort(
        (a: Activity, b: Activity) =>
          new Date(b.activityDate).getTime() - new Date(a.activityDate).getTime()
      );
      setActivities(sorted);
    }
  };

  const fetchChart = async () => {
    const res = await fetch("/api/analytics?range=month");
    const data = await res.json();
    if (data.success && data.data.entries.length > 0) {
      setChartData(
        data.data.entries.map((e: { date: string; score: number }) => ({
          date: e.date.slice(5),
          score: e.score,
        }))
      );
    }
  };

  const handleActivitySaved = () => {
    fetchStats();
    fetchActivities();
    fetchChart();
    setShowModal(false);
  };

  const handleDeleteActivity = async (id: string) => {
    if (!confirm("確定要刪除這條記錄嗎？")) return;
    const res = await fetch(`/api/activities/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      setActivities((prev) => prev.filter((a) => a.id !== id));
      fetchStats();
      fetchChart();
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a] pb-28 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-rose-500/[0.07] blur-[120px]" />
        <div className="absolute top-1/4 -right-20 w-72 h-72 rounded-full bg-violet-600/[0.06] blur-[100px]" />
        <div className="absolute bottom-1/3 left-1/4 w-64 h-64 rounded-full bg-primary/[0.05] blur-[100px]" />
      </div>

      <div className="relative z-10">
        <div className="px-6 pt-14 pb-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-2">Welcome back</p>
              <h1 className="text-[28px] font-bold text-white tracking-tight leading-none">
                <span className="text-white">今夜</span>
                <span className="text-gradient">未眠</span>
              </h1>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08]">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-slate-400 font-medium">在線</span>
            </div>
          </div>
        </div>

        <div className="px-6 mb-6">
          <div className="rounded-3xl overflow-hidden relative animate-fade-up">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl" />
            <div className="absolute inset-0 border border-white/[0.1] rounded-3xl" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <div className="relative p-6">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-widest mb-3">本月概覽</p>
                  <div className="flex items-end gap-8">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 rounded-lg bg-primary/[0.15] flex items-center justify-center">
                          <Flame className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">活動</span>
                      </div>
                      <div className="text-[40px] font-extrabold text-white leading-none tabular-nums">
                        {stats.monthlyCount}
                      </div>
                      <div className="text-[10px] text-slate-600 font-medium mt-1">次記錄</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 rounded-lg bg-rose-400/[0.15] flex items-center justify-center">
                          <Heart className="w-3.5 h-3.5 text-rose-400" />
                        </div>
                        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">滿意度</span>
                      </div>
                      <div className="text-[40px] font-extrabold text-white leading-none tabular-nums">
                        {stats.avgSatisfaction}
                      </div>
                      <div className="text-[10px] text-slate-600 font-medium mt-1">/ 10 分</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 -mx-2 -mb-2">
                <div className="h-[120px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f87171" stopOpacity={0.4} />
                          <stop offset="50%" stopColor="#fb923c" stopOpacity={0.15} />
                          <stop offset="100%" stopColor="#f87171" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Tooltip
                        contentStyle={{
                          background: "rgba(15,23,42,0.9)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "12px",
                          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                          padding: "8px 12px",
                          fontSize: "11px",
                          color: "#fff",
                        }}
                        labelStyle={{ display: "none" }}
                        formatter={(value: number) => [`${value} 分`, "滿意度"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke="#f87171"
                        strokeWidth={2.5}
                        fill="url(#chartGlow)"
                        dot={false}
                        activeDot={{
                          r: 4,
                          fill: "#f87171",
                          stroke: "#fff",
                          strokeWidth: 2,
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 mb-8">
          <div className="grid grid-cols-3 gap-3">
            <Link
              href="/analytics"
              className="group rounded-2xl p-4 relative overflow-hidden animate-fade-up"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.08] rounded-2xl" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-primary/[0.08] to-transparent rounded-2xl" />
              <div className="relative text-center">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-rose-500/10 flex items-center justify-center mx-auto mb-2.5 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <span className="text-[11px] text-slate-400 font-semibold">數據分析</span>
              </div>
            </Link>

            <button
              onClick={() => setShowReport(true)}
              className="group rounded-2xl p-4 relative overflow-hidden animate-fade-up text-left"
              style={{ animationDelay: "0.15s" }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.08] rounded-2xl" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-violet-500/[0.08] to-transparent rounded-2xl" />
              <div className="relative text-center">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/10 flex items-center justify-center mx-auto mb-2.5 group-hover:scale-110 transition-transform duration-300">
                  <FileImage className="w-5 h-5 text-violet-400" />
                </div>
                <span className="text-[11px] text-slate-400 font-semibold">年度報告</span>
              </div>
            </button>

            <button
              onClick={() => setShowModal(true)}
              className="group rounded-2xl p-4 relative overflow-hidden animate-fade-up text-left"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.1] to-rose-500/[0.04] border border-primary/[0.15] rounded-2xl" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-primary/[0.15] to-transparent rounded-2xl" />
              <div className="relative text-center">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/25 to-rose-400/15 flex items-center justify-center mx-auto mb-2.5 group-hover:scale-110 group-hover:rotate-90 transition-all duration-300">
                  <Plus className="w-5 h-5 text-primary" />
                </div>
                <span className="text-[11px] text-primary font-semibold">快速記錄</span>
              </div>
            </button>
          </div>
        </div>

        <div className="px-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-4 rounded-full bg-gradient-to-b from-primary to-rose-400" />
              <h2 className="text-base font-bold text-white tracking-tight">最近活動</h2>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-600 font-medium tabular-nums">{activities.length} 筆</span>
              <Link href="/analytics" className="text-primary">
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <div className="space-y-3">
            {activities.length === 0 ? (
              <div className="rounded-2xl p-10 text-center animate-fade-up relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent border border-white/[0.06] rounded-2xl" />
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-7 h-7 text-slate-600" />
                  </div>
                  <p className="text-slate-400 font-medium mb-1">尚無記錄</p>
                  <p className="text-slate-600 text-sm">點擊「快速記錄」開始</p>
                </div>
              </div>
            ) : (
              activities.map((activity, idx) => {
                const emotions: string[] = JSON.parse(activity.emotionTags || "[]");
                const date = new Date(activity.activityDate);
                const scorePercent = (activity.satisfactionScore / 10) * 100;
                return (
                  <div
                    key={activity.id}
                    className="rounded-2xl p-5 animate-fade-up relative overflow-hidden group"
                    style={{ animationDelay: `${idx * 0.06}s` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-white/[0.015] border border-white/[0.07] rounded-2xl group-hover:border-white/[0.12] transition-colors duration-300" />
                    <div
                      className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl bg-gradient-to-b from-primary to-rose-400"
                      style={{ opacity: scorePercent / 100 }}
                    />

                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/15 to-rose-400/10 flex items-center justify-center border border-primary/[0.1]">
                            <span className="text-sm font-bold text-primary tabular-nums">
                              {date.getDate()}
                            </span>
                          </div>
                          <div>
                            <span className="text-sm text-white font-semibold">
                              {date.toLocaleDateString("zh-TW", { month: "long", day: "numeric" })}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Clock className="w-3 h-3 text-slate-600" />
                              <span className="text-xs text-slate-500">{activity.durationMinutes} 分鐘</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/[0.1] border border-primary/20">
                            <Heart className="w-3 h-3 text-primary fill-primary" />
                            <span className="text-xs font-bold text-primary tabular-nums">{activity.satisfactionScore}</span>
                          </div>
                          <button
                            onClick={() => handleDeleteActivity(activity.id)}
                            className="p-1.5 rounded-lg text-slate-700 hover:text-red-400 hover:bg-red-400/[0.1] transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden mb-3">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${scorePercent}%`,
                            background: "linear-gradient(90deg, #f87171, #fb923c)",
                          }}
                        />
                      </div>
                      {emotions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {emotions.map((emotion: string) => (
                            <span
                              key={emotion}
                              className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[11px] font-medium text-slate-400"
                            >
                              {emotion}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-br from-primary to-rose-400 rounded-2xl shadow-[0_8px_24px_rgba(255,136,130,0.4)] flex items-center justify-center z-50 btn-glow"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      <BottomNav />

      {showModal && <AddActivityModal onClose={() => setShowModal(false)} onSave={handleActivitySaved} />}

      {showReport && <ReportGenerator onClose={() => setShowReport(false)} />}
    </div>
  );
}
