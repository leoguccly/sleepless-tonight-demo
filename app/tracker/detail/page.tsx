"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import BottomNav from "@/components/layout/BottomNav";
import { ArrowLeft, Clock, Users, User, Heart, NotebookPen, Trash2 } from "lucide-react";

interface ActivityDetail {
  id: string;
  activityDate: string;
  activityMode: string;
  satisfactionScore: number;
  emotionTags: string;
  durationMinutes: number;
  encryptedNote: string | null;
  partner?: { nickname: string } | null;
}

export default function TrackerDetailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");
  const [activity, setActivity] = useState<ActivityDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchActivity(id);
  }, [id]);

  const fetchActivity = async (activityId: string) => {
    const res = await fetch(`/api/activities/${activityId}`);
    const data = await res.json();
    if (data.success) setActivity(data.data);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!id || !confirm("確定要刪除這條記錄嗎？")) return;
    const res = await fetch(`/api/activities/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) router.push("/tracker");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen bg-[#0f172a] pb-28">
        <div className="px-6 pt-14 text-center">
          <p className="text-slate-400">找不到記錄</p>
          <button onClick={() => router.push("/tracker")} className="mt-4 text-primary text-sm font-medium">
            返回追蹤器
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  const emotions = JSON.parse(activity.emotionTags || "[]");
  const date = new Date(activity.activityDate);
  const isPartner = activity.activityMode === "partner";

  return (
    <div className="min-h-screen bg-[#0f172a] pb-28">
      {/* Header */}
      <header className="sticky top-0 z-50 px-6 py-4 bg-[#0f172a]/80 backdrop-blur-2xl border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-xl hover:bg-white/[0.06] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <h1 className="text-base font-bold text-white">記錄詳情</h1>
          <div className="w-9" />
        </div>
      </header>

      <div className="px-6 pt-6 space-y-5">
        {/* Main Card */}
        <div className="glass-card rounded-2xl p-6 animate-fade-up">
          {/* Date & Score */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-xs text-slate-600 font-medium mb-1">
                {date.toLocaleDateString("en-US", { weekday: "long" })}
              </p>
              <p className="text-2xl font-bold text-white">
                {date.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-extrabold text-gradient tabular-nums">{activity.satisfactionScore}</div>
              <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider">分數</p>
            </div>
          </div>

          {/* Satisfaction bar */}
          <div className="flex items-center gap-[3px] mb-6">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  i < activity.satisfactionScore
                    ? "bg-gradient-to-r from-primary to-rose-400"
                    : "bg-white/[0.06]"
                }`}
              />
            ))}
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 text-center">
              <Clock className="w-4 h-4 text-slate-500 mx-auto mb-2" />
              <p className="text-lg font-bold text-white">{activity.durationMinutes} 分鐘</p>
              <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider">時長</p>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 text-center">
              {isPartner ? (
                <Users className="w-4 h-4 text-primary mx-auto mb-2" />
              ) : (
                <User className="w-4 h-4 text-violet-400 mx-auto mb-2" />
              )}
              <p className="text-lg font-bold text-white">
                {isPartner ? (activity.partner?.nickname || "伴侶") : "獨自"}
              </p>
              <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider">模式</p>
            </div>
          </div>

          {/* Emotions */}
          {emotions.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-3.5 h-3.5 text-slate-500" />
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">情緒</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {emotions.map((emotion: string) => (
                  <span
                    key={emotion}
                    className="px-3 py-1.5 rounded-xl bg-primary/[0.08] border border-primary/[0.15] text-xs font-medium text-primary"
                  >
                    {emotion}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Note */}
          {activity.encryptedNote && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <NotebookPen className="w-3.5 h-3.5 text-slate-500" />
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">私密備註</p>
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 text-sm text-slate-300 leading-relaxed">
                {activity.encryptedNote}
              </div>
            </div>
          )}
        </div>

        {/* Delete */}
        <button
          onClick={handleDelete}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-red-400/[0.08] border border-red-400/[0.15] text-red-400 font-medium hover:bg-red-400/[0.15] transition-all duration-200 animate-fade-up"
          style={{ animationDelay: "0.1s" }}
        >
          <Trash2 className="w-4 h-4" />
          刪除記錄
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
