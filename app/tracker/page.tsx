"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import BottomNav from "@/components/layout/BottomNav";
import AddActivityModal from "@/components/tracker/AddActivityModal";
import { Plus, Heart, Clock, Trash2, Users, User } from "lucide-react";

interface Activity {
  id: string;
  activityDate: string;
  activityMode: string;
  satisfactionScore: number;
  emotionTags: string;
  durationMinutes: number;
  partner?: { nickname: string } | null;
}

const FILTERS = [
  { key: "all", label: "全部", icon: null },
  { key: "partner", label: "伴侶", icon: Users },
  { key: "solo", label: "獨自", icon: User },
];

export default function TrackerPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, []);

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

  const handleDelete = async (id: string) => {
    if (!confirm("確定要刪除這條記錄嗎？")) return;

    const res = await fetch(`/api/activities/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      setActivities(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleActivitySaved = () => {
    fetchActivities();
    setShowModal(false);
  };

  const filtered = activeFilter === "all"
    ? activities
    : activities.filter(a => a.activityMode === activeFilter);

  return (
    <div className="min-h-screen bg-[#0f172a] pb-28">
      {/* Header */}
      <header className="sticky top-0 z-50 px-6 py-4 bg-[#0f172a]/80 backdrop-blur-2xl border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">追蹤器</h1>
            <p className="text-[11px] text-slate-600 font-medium tracking-wide">{filtered.length} 筆記錄</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="p-2.5 rounded-xl bg-primary/[0.12] border border-primary/20 text-primary hover:bg-primary/25 transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="px-6 pt-5">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {FILTERS.map((filter) => {
            const Icon = filter.icon;
            return (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 ${
                  activeFilter === filter.key
                    ? "bg-primary/[0.15] text-primary border border-primary/25 shadow-[0_0_12px_rgba(255,136,130,0.15)]"
                    : "bg-white/[0.03] text-slate-500 border border-white/[0.06] hover:bg-white/[0.06] hover:text-slate-400"
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                {filter.label}
              </button>
            );
          })}
        </div>

        {/* Records */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="glass-card rounded-2xl p-10 text-center animate-fade-up">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
                <Heart className="w-7 h-7 text-slate-600" />
              </div>
              <p className="text-slate-400 font-medium mb-1">尚無記錄</p>
              <p className="text-slate-600 text-sm">點擊 + 開始追蹤</p>
            </div>
          ) : (
            filtered.map((activity, idx) => {
              const emotions = JSON.parse(activity.emotionTags || "[]");
              const date = new Date(activity.activityDate);
              return (
                <div
                  key={activity.id}
                  className="glass-card-hover rounded-2xl p-5 animate-fade-up group"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        activity.activityMode === "partner"
                          ? "bg-gradient-to-br from-primary/20 to-rose-400/10"
                          : "bg-gradient-to-br from-violet-500/20 to-indigo-500/10"
                      }`}>
                        {activity.activityMode === "partner"
                          ? <Users className="w-[18px] h-[18px] text-primary" />
                          : <User className="w-[18px] h-[18px] text-violet-400" />
                        }
                      </div>
                      <div>
                        <div className="text-sm text-white font-semibold">
                          {date.toLocaleDateString("zh-CN", { month: "long", day: "numeric" })}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-600" />
                          <span className="text-xs text-slate-500">{activity.durationMinutes} 分鐘</span>
                          {activity.partner && (
                            <>
                              <span className="text-slate-700">&middot;</span>
                              <span className="text-xs text-slate-500">{activity.partner.nickname}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Score badge */}
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/[0.1] border border-primary/20">
                        <Heart className="w-3 h-3 text-primary fill-primary" />
                        <span className="text-xs font-bold text-primary tabular-nums">{activity.satisfactionScore}</span>
                      </div>
                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(activity.id)}
                        className="p-1.5 rounded-lg text-slate-700 hover:text-red-400 hover:bg-red-400/[0.1] opacity-0 group-hover:opacity-100 transition-all duration-200"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Satisfaction bar */}
                  <div className="flex items-center gap-[3px] mb-3">
                    {[...Array(10)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full ${
                          i < activity.satisfactionScore
                            ? "bg-gradient-to-r from-primary to-rose-400"
                            : "bg-white/[0.06]"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Emotion tags */}
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
              );
            })
          )}
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-br from-primary to-rose-400 rounded-2xl shadow-[0_8px_24px_rgba(255,136,130,0.4)] flex items-center justify-center z-50 btn-glow"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      <BottomNav />

      {showModal && (
        <AddActivityModal
          onClose={() => setShowModal(false)}
          onSave={handleActivitySaved}
        />
      )}
    </div>
  );
}
