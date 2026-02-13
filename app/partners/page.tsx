"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/layout/BottomNav";
import { ArrowLeft, Plus, Trash2, Users, Heart, Flame, AlertTriangle, X } from "lucide-react";

interface Partner {
  id: string;
  nickname: string;
  colorTag: string | null;
  notes: string | null;
  activityCount: number;
  avgScore: number;
  lastActivity: string | null;
  createdAt: string;
}

const COLOR_OPTIONS = [
  { value: "rose", bg: "bg-rose-400/20", border: "border-rose-400/30", text: "text-rose-400" },
  { value: "violet", bg: "bg-violet-400/20", border: "border-violet-400/30", text: "text-violet-400" },
  { value: "sky", bg: "bg-sky-400/20", border: "border-sky-400/30", text: "text-sky-400" },
  { value: "emerald", bg: "bg-emerald-400/20", border: "border-emerald-400/30", text: "text-emerald-400" },
  { value: "amber", bg: "bg-amber-400/20", border: "border-amber-400/30", text: "text-amber-400" },
];

function getColorClasses(colorTag: string | null) {
  return COLOR_OPTIONS.find((c) => c.value === colorTag) || COLOR_OPTIONS[0];
}

export default function PartnersPage() {
  const router = useRouter();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [nickname, setNickname] = useState("");
  const [colorTag, setColorTag] = useState("rose");
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    const res = await fetch("/api/partners");
    const data = await res.json();
    if (data.success) setPartners(data.data);
  };

  const handleCreate = async () => {
    if (!nickname.trim()) return;
    setError("");

    const res = await fetch("/api/partners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname: nickname.trim(), colorTag }),
    });

    const data = await res.json();
    if (data.success) {
      if (data.warning) setWarning(data.warning);
      setNickname("");
      setShowModal(false);
      await fetchPartners();
    } else {
      setError(data.message || "新增失敗");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`確定要移除伴侶「${name}」嗎？活動記錄將會保留。`)) return;

    const res = await fetch("/api/partners", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    const data = await res.json();
    if (data.success) {
      setPartners((prev) => prev.filter((p) => p.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] pb-28">
      {/* Header */}
      <header className="sticky top-0 z-50 px-6 py-4 bg-[#0f172a]/80 backdrop-blur-2xl border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-xl hover:bg-white/[0.06] transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <h1 className="text-base font-bold text-white">伴侶管理</h1>
          <button
            onClick={() => setShowModal(true)}
            className="p-2.5 rounded-xl bg-primary/[0.12] border border-primary/20 text-primary hover:bg-primary/25 transition-all"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Warning banner */}
      {warning && (
        <div className="mx-6 mt-4 p-3 rounded-xl bg-amber-400/[0.08] border border-amber-400/[0.15] flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="text-xs text-amber-400">{warning}</span>
          </div>
          <button onClick={() => setWarning("")} className="text-amber-400/50 hover:text-amber-400">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="px-6 pt-5">
        <p className="text-[11px] text-slate-700 mb-5">使用代號以保護隱私，請勿使用真實姓名。</p>

        {partners.length === 0 ? (
          <div className="glass-card rounded-2xl p-10 text-center animate-fade-up">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium mb-1">尚未新增伴侶</p>
            <p className="text-slate-600 text-sm">點擊 + 新增伴侶代號</p>
          </div>
        ) : (
          <div className="space-y-3">
            {partners.map((partner, idx) => {
              const colors = getColorClasses(partner.colorTag);
              return (
                <div
                  key={partner.id}
                  className="glass-card-hover rounded-2xl p-5 animate-fade-up group"
                  style={{ animationDelay: `${idx * 0.06}s` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center`}>
                        <span className={`text-sm font-bold ${colors.text}`}>
                          {partner.nickname.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">{partner.nickname}</h3>
                        <span className="text-[11px] text-slate-600">
                          {new Date(partner.createdAt).toLocaleDateString("zh-TW", { year: "numeric", month: "short" })} 起
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(partner.id, partner.nickname)}
                      className="p-1.5 rounded-lg text-slate-700 hover:text-red-400 hover:bg-red-400/[0.1] opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-white/[0.03] p-2.5 text-center">
                      <Flame className="w-3 h-3 text-primary mx-auto mb-1" />
                      <div className="text-sm font-bold text-white tabular-nums">{partner.activityCount}</div>
                      <div className="text-[9px] text-slate-700 uppercase">活動次數</div>
                    </div>
                    <div className="rounded-lg bg-white/[0.03] p-2.5 text-center">
                      <Heart className="w-3 h-3 text-rose-400 mx-auto mb-1" />
                      <div className="text-sm font-bold text-white tabular-nums">{partner.avgScore || "-"}</div>
                      <div className="text-[9px] text-slate-700 uppercase">平均分數</div>
                    </div>
                    <div className="rounded-lg bg-white/[0.03] p-2.5 text-center">
                      <div className="text-sm font-bold text-white tabular-nums">
                        {partner.lastActivity
                          ? new Date(partner.lastActivity).toLocaleDateString("zh-TW", { month: "short", day: "numeric" })
                          : "-"}
                      </div>
                      <div className="text-[9px] text-slate-700 uppercase">最近活動</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Partner Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-[430px] bg-[#0f172a]/95 backdrop-blur-2xl rounded-t-3xl border-t border-white/[0.1] shadow-[0_-8px_40px_rgba(0,0,0,0.5)] animate-fade-up">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-white/[0.1] rounded-full" />
            </div>
            <div className="px-6 pb-3">
              <h2 className="text-lg font-bold text-white mb-1">新增伴侶</h2>
              <p className="text-xs text-slate-600 font-medium">使用代號，而非真實姓名</p>
            </div>
            <div className="px-6 pb-4 space-y-4">
              <input
                type="text"
                placeholder="代號（例如：A、小貓、星星）"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-primary/30 focus:bg-white/[0.05] transition-all duration-200"
              />

              {/* Color picker */}
              <div>
                <label className="text-xs text-slate-500 font-medium mb-2 block">顏色標籤</label>
                <div className="flex gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setColorTag(c.value)}
                      className={`w-9 h-9 rounded-xl ${c.bg} border-2 transition-all ${
                        colorTag === c.value ? c.border + " scale-110" : "border-transparent"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {error && <p className="text-xs text-red-400">{error}</p>}
            </div>
            <div className="px-6 pb-8 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-slate-400 font-medium hover:bg-white/[0.08] transition-all"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={!nickname.trim()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-rose-400 text-sm text-white font-semibold shadow-[0_4px_16px_rgba(255,136,130,0.3)] disabled:opacity-40 disabled:shadow-none transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                新增
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
