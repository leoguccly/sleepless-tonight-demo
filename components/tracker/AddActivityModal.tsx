"use client";

import { useState, useEffect } from "react";
import { Heart, Clock, Users, Sparkles, NotebookPen } from "lucide-react";

interface Partner {
  id: string;
  nickname: string;
  colorTag: string | null;
}

interface AddActivityModalProps {
  onClose: () => void;
  onSave: () => void;
}

export default function AddActivityModal({ onClose, onSave }: AddActivityModalProps) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [duration, setDuration] = useState(30);
  const [rating, setRating] = useState(8);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [selectedPartner, setSelectedPartner] = useState("solo");
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const emotions = [
    { id: "relaxed", label: "放鬆", emoji: "\u{1F60C}" },
    { id: "excited", label: "興奮", emoji: "\u{1F525}" },
    { id: "intimate", label: "親密", emoji: "\u{1F495}" },
    { id: "curious", label: "探索", emoji: "\u{1F914}" },
    { id: "happy", label: "愉悅", emoji: "\u{1F60A}" },
    { id: "tired", label: "疲憊", emoji: "\u{1F634}" },
  ];

  useEffect(() => {
    fetch("/api/partners")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setPartners(data.data);
      })
      .catch(() => {});
  }, []);

  const toggleEmotion = (id: string) => {
    setSelectedEmotions(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    setIsSaving(true);

    try {
      const isSolo = selectedPartner === "solo";
      const partnerName = isSolo ? "" : partners.find(p => p.id === selectedPartner)?.nickname || "";

      const response = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          duration,
          partnerId: isSolo ? null : selectedPartner,
          satisfaction: rating,
          emotions: selectedEmotions,
          note,
          partnerName,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onSave();
      } else {
        alert(`儲存失敗：${data.message || "未知錯誤"}`);
      }
    } catch (error) {
      alert(`儲存失敗：${error instanceof Error ? error.message : "網路錯誤"}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-[430px] bg-[#0f172a]/95 backdrop-blur-2xl rounded-t-3xl border-t border-white/[0.1] shadow-[0_-8px_40px_rgba(0,0,0,0.5)] max-h-[90vh] flex flex-col animate-fade-up">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-white/[0.1] rounded-full" />
        </div>

        {/* Title */}
        <div className="px-6 pb-5 border-b border-white/[0.05] shrink-0">
          <h2 className="text-lg font-bold text-white tracking-tight">新增記錄</h2>
          <p className="text-xs text-slate-600 font-medium">記錄你的親密時刻</p>
        </div>

        {/* Scrollable form area */}
        <div className="flex-1 overflow-y-auto min-h-0">
        <div className="px-6 py-6 space-y-7 pb-28">
          {/* Date */}
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              日期
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/30 focus:bg-white/[0.05] transition-all duration-200"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              <Clock className="w-3.5 h-3.5" />
              時長
            </label>
            <input
              type="range"
              min="5"
              max="120"
              step="5"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full h-1.5 bg-white/[0.06] rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between mt-2.5">
              <span className="text-[11px] text-slate-600">5 分鐘</span>
              <span className="text-sm font-bold text-gradient tabular-nums">{duration} 分鐘</span>
              <span className="text-[11px] text-slate-600">2 小時</span>
            </div>
          </div>

          {/* Partner Select */}
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              <Users className="w-3.5 h-3.5" />
              伴侶
            </label>
            <select
              value={selectedPartner}
              onChange={(e) => setSelectedPartner(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/30 focus:bg-white/[0.05] transition-all duration-200 appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 16px center" }}
            >
              <option value="solo" className="bg-[#0f172a] text-white">👤 獨自 / 個人</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#0f172a] text-white">
                  👥 {p.nickname}
                </option>
              ))}
            </select>
            {partners.length === 0 && (
              <p className="text-[10px] text-slate-600 mt-1.5">尚未新增伴侶，前往「伴侶管理」建立</p>
            )}
          </div>

          {/* Emotions */}
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              <Heart className="w-3.5 h-3.5" />
              感受
            </label>
            <div className="flex flex-wrap gap-2">
              {emotions.map((emotion) => (
                <button
                  key={emotion.id}
                  onClick={() => toggleEmotion(emotion.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-2 ${
                    selectedEmotions.includes(emotion.id)
                      ? "bg-primary/[0.15] text-primary border border-primary/25 shadow-[0_0_12px_rgba(255,136,130,0.15)]"
                      : "bg-white/[0.03] text-slate-500 border border-white/[0.06] hover:bg-white/[0.06] hover:text-slate-400"
                  }`}
                >
                  <span className="text-sm">{emotion.emoji}</span>
                  {emotion.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              滿意度
            </label>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="w-full h-1.5 bg-white/[0.06] rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between mt-2 text-[11px] text-slate-600">
              <span>1</span>
              <span>5</span>
              <span>10</span>
            </div>
            <div className="mt-4 text-center">
              <span className="text-4xl font-extrabold text-gradient tabular-nums">
                {rating}
              </span>
              <span className="text-xs text-slate-600 ml-1 font-medium">/ 10</span>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              <NotebookPen className="w-3.5 h-3.5" />
              私密備註
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="記錄你的私密感受（端對端加密）"
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-primary/30 focus:bg-white/[0.05] transition-all duration-200 h-24 resize-none"
            />
          </div>
        </div>
        </div>

        {/* Submit - sticky at bottom, never scrolls */}
        <div className="px-6 py-5 border-t border-white/[0.05] bg-[#0f172a]/95 shrink-0">
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="w-full bg-gradient-to-r from-primary to-rose-400 text-white font-bold py-3.5 rounded-xl shadow-[0_8px_24px_rgba(255,136,130,0.3)] hover:shadow-[0_8px_32px_rgba(255,136,130,0.5)] transition-all duration-300 disabled:opacity-40 disabled:shadow-none"
          >
            {isSaving ? "儲存中..." : "儲存記錄"}
          </button>
        </div>
      </div>
    </div>
  );
}
