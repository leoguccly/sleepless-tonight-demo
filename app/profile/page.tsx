"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import BottomNav from "@/components/layout/BottomNav";
import { User, Settings, Shield, LogOut, Heart, Flame, Calendar, Users, Package } from "lucide-react";

interface ProfileStats {
  totalRecords: number;
  avgSatisfaction: number;
  streakDays: number;
  partnerCount: number;
  email: string;
}

export default function ProfilePage() {
  const [stats, setStats] = useState<ProfileStats | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const res = await fetch("/api/profile");
    const data = await res.json();
    if (data.success) setStats(data.data);
  };

  const statCards = stats ? [
    { label: "記錄", value: stats.totalRecords, icon: Flame, color: "text-primary" },
    { label: "平均分數", value: stats.avgSatisfaction, icon: Heart, color: "text-rose-400" },
    { label: "連續天數", value: `${stats.streakDays}天`, icon: Calendar, color: "text-amber-400" },
    { label: "伴侶", value: stats.partnerCount, icon: Users, color: "text-violet-400" },
  ] : [];

  const menuItems = [
    { icon: Users, label: "伴侶管理", href: "/partners", color: "text-violet-400" },
    { icon: Package, label: "我的訂單", href: "/orders", color: "text-primary" },
    { icon: Settings, label: "帳號設定", href: "/settings", color: "text-slate-400" },
    { icon: Shield, label: "隱私與安全", href: "/settings", color: "text-slate-400" },
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] pb-28">
      {/* Header */}
      <div className="relative px-6 pt-14 pb-8">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.04] to-transparent pointer-events-none" />
        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-rose-400/10 flex items-center justify-center border border-white/[0.08]">
            <User className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Anonymous</h1>
            <p className="text-xs text-slate-600 font-medium">{stats?.email || "..."}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-6 mb-8">
        <div className="grid grid-cols-4 gap-3">
          {statCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="glass-card rounded-2xl p-4 text-center animate-fade-up"
                style={{ animationDelay: `${idx * 0.06}s` }}
              >
                <Icon className={`w-4 h-4 ${card.color} mx-auto mb-2`} />
                <div className="text-xl font-extrabold text-white tabular-nums mb-0.5">{card.value}</div>
                <div className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider">{card.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Menu */}
      <div className="px-6 space-y-2">
        {menuItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center justify-between p-4 rounded-2xl glass-card-hover animate-fade-up"
              style={{ animationDelay: `${(idx + 4) * 0.06}s` }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center">
                  <Icon className={`w-[18px] h-[18px] ${item.color}`} />
                </div>
                <span className="text-sm text-white font-medium">{item.label}</span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-700" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </Link>
          );
        })}

        {/* Logout */}
        <button className="w-full flex items-center justify-between p-4 rounded-2xl glass-card-hover animate-fade-up mt-4" style={{ animationDelay: "0.4s" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-400/[0.08] flex items-center justify-center">
              <LogOut className="w-[18px] h-[18px] text-red-400" />
            </div>
            <span className="text-sm text-red-400 font-medium">登出</span>
          </div>
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
