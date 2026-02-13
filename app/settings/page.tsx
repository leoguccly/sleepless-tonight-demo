"use client";

import BottomNav from "@/components/layout/BottomNav";
import { User, Shield, Bell, Moon, AlertTriangle, CloudUpload, LogOut, ChevronRight } from "lucide-react";

export default function SettingsPage() {
  const accountItems = [
    { icon: Shield, label: "帳號安全", color: "text-sky-400" },
    { icon: Shield, label: "隱私設定", color: "text-emerald-400" },
    { icon: Bell, label: "通知", color: "text-amber-400" },
  ];

  const appSettings = [
    { icon: Moon, label: "深色模式", enabled: true },
    { icon: AlertTriangle, label: "緊急隱藏模式", enabled: false },
    { icon: CloudUpload, label: "自動備份", enabled: true },
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] pb-28">
      {/* Header */}
      <header className="sticky top-0 z-50 px-6 py-4 bg-[#0f172a]/80 backdrop-blur-2xl border-b border-white/[0.06]">
        <h1 className="text-xl font-bold text-white tracking-tight">設定</h1>
        <p className="text-[11px] text-slate-600 font-medium tracking-wide">偏好設定與安全性</p>
      </header>

      <div className="px-6 pt-6 space-y-6">
        {/* Account Card */}
        <div className="glass-card rounded-2xl p-5 animate-fade-up">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-rose-400/10 flex items-center justify-center border border-white/[0.08]">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">匿名使用者</h2>
              <p className="text-xs text-slate-600 font-medium">ID: pp_20260201</p>
            </div>
          </div>

          <div className="space-y-1">
            {accountItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-white/[0.04] transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center">
                      <Icon className={`w-4 h-4 ${item.color}`} />
                    </div>
                    <span className="text-sm text-slate-300 font-medium group-hover:text-white transition-colors">{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-slate-500 transition-colors" />
                </button>
              );
            })}
          </div>
        </div>

        {/* App Settings */}
        <div className="glass-card rounded-2xl p-5 animate-fade-up" style={{ animationDelay: "0.08s" }}>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">應用程式設定</h3>
          <div className="space-y-1">
            {appSettings.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex items-center justify-between p-3.5 rounded-xl hover:bg-white/[0.04] transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center">
                      <Icon className="w-4 h-4 text-slate-400" />
                    </div>
                    <span className="text-sm text-slate-300 font-medium">{item.label}</span>
                  </div>
                  <div className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors duration-200 ${
                    item.enabled ? "bg-primary/50" : "bg-white/[0.08]"
                  }`}>
                    <div className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-200 ${
                      item.enabled ? "left-5" : "left-1"
                    }`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Logout */}
        <button
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-red-400/[0.08] border border-red-400/[0.15] text-red-400 font-medium hover:bg-red-400/[0.15] transition-all duration-200 animate-fade-up"
          style={{ animationDelay: "0.16s" }}
        >
          <LogOut className="w-4 h-4" />
          登出
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
