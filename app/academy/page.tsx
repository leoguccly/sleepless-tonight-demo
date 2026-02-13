"use client";

import { useState } from "react";
import BottomNav from "@/components/layout/BottomNav";
import {
  BookOpen,
  Heart,
  MessageCircle,
  Shield,
  Sparkles,
  ChevronRight,
  Clock,
  Star,
  GraduationCap,
  CheckCircle2,
  Lock,
  Users,
  Brain,
  Stethoscope,
} from "lucide-react";

type Category = "all" | "relationship" | "communication" | "health" | "guide";
type ContentItem = {
  id: string;
  title: string;
  description: string;
  category: Category;
  type: "article" | "course" | "qa";
  duration: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  icon: React.ReactNode;
  completed?: boolean;
  locked?: boolean;
  expert?: { name: string; role: string };
};

const CATEGORIES: { key: Category; label: string; icon: React.ReactNode }[] = [
  { key: "all", label: "全部", icon: <Sparkles className="w-4 h-4" /> },
  { key: "relationship", label: "關係", icon: <Heart className="w-4 h-4" /> },
  { key: "communication", label: "溝通", icon: <MessageCircle className="w-4 h-4" /> },
  { key: "health", label: "健康", icon: <Shield className="w-4 h-4" /> },
  { key: "guide", label: "指南", icon: <BookOpen className="w-4 h-4" /> },
];

const CONTENT: ContentItem[] = [
  // Knowledge Base articles
  {
    id: "a1",
    title: "理解親密關係：超越肉體層面",
    description: "探索關係中親密感的情感、智識和精神層面。",
    category: "relationship",
    type: "article",
    duration: "8 分鐘閱讀",
    difficulty: "beginner",
    icon: <Heart className="w-5 h-5" />,
    completed: true,
  },
  {
    id: "a2",
    title: "溝通入門：表達需求",
    description: "學習基於實證的技巧，有效地傳達你的慾望和界線。",
    category: "communication",
    type: "article",
    duration: "12 分鐘閱讀",
    difficulty: "beginner",
    icon: <MessageCircle className="w-5 h-5" />,
    completed: true,
  },
  {
    id: "a3",
    title: "性健康基礎知識",
    description: "全面理解你的身體、安全實踐，以及何時尋求專業協助的指南。",
    category: "health",
    type: "article",
    duration: "15 分鐘閱讀",
    difficulty: "beginner",
    icon: <Shield className="w-5 h-5" />,
  },
  {
    id: "a4",
    title: "商品選擇指南",
    description: "如何選擇適合你需求的商品。材質、安全標準和保養說明。",
    category: "guide",
    type: "article",
    duration: "10 分鐘閱讀",
    difficulty: "beginner",
    icon: <BookOpen className="w-5 h-5" />,
  },
  // Interactive courses
  {
    id: "c1",
    title: "伴侶溝通工作坊",
    description: "五個單元的互動課程，教你如何與伴侶進行有意義的親密對話。",
    category: "communication",
    type: "course",
    duration: "5 堂課",
    difficulty: "intermediate",
    icon: <Users className="w-5 h-5" />,
  },
  {
    id: "c2",
    title: "自我探索之旅",
    description: "引導式問卷和練習，幫助你更好地理解自己的偏好和界線。",
    category: "relationship",
    type: "course",
    duration: "4 堂課",
    difficulty: "beginner",
    icon: <Brain className="w-5 h-5" />,
  },
  {
    id: "c3",
    title: "進階：維持長期關係的熱情",
    description: "以研究為基礎的策略，在長期關係中保持火花。",
    category: "relationship",
    type: "course",
    duration: "6 堂課",
    difficulty: "advanced",
    icon: <Sparkles className="w-5 h-5" />,
    locked: true,
  },
  {
    id: "c4",
    title: "個人健康技巧",
    description: "無批判的自我探索、正念和個人滿足指南。",
    category: "health",
    type: "course",
    duration: "3 堂課",
    difficulty: "beginner",
    icon: <Heart className="w-5 h-5" />,
  },
  // Expert Q&A
  {
    id: "q1",
    title: "擁有不同的慾望程度是正常的嗎？",
    description: "慾望差異是最常見的關係挑戰之一。專家這樣說。",
    category: "relationship",
    type: "qa",
    duration: "5 分鐘閱讀",
    difficulty: "beginner",
    icon: <Stethoscope className="w-5 h-5" />,
    expert: { name: "林醫師", role: "關係治療師" },
  },
  {
    id: "q2",
    title: "如何在信任破裂後重建？",
    description: "治療師對療癒、界線和共同前進的觀點。",
    category: "communication",
    type: "qa",
    duration: "7 分鐘閱讀",
    difficulty: "intermediate",
    icon: <Brain className="w-5 h-5" />,
    expert: { name: "陳心理師", role: "臨床心理師" },
  },
  {
    id: "q3",
    title: "何時應該尋求健康專業人士的協助？",
    description: "警訊、例行檢查，以及何時不適不只是「正常」。醫師的誠實建議。",
    category: "health",
    type: "qa",
    duration: "6 分鐘閱讀",
    difficulty: "beginner",
    icon: <Stethoscope className="w-5 h-5" />,
    expert: { name: "王醫師", role: "婦產科專家" },
  },
];

const difficultyColors = {
  beginner: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  intermediate: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  advanced: "text-rose-400 bg-rose-500/10 border-rose-500/20",
};

const difficultyLabels = {
  beginner: "入門",
  intermediate: "進階",
  advanced: "高級",
};

const typeLabels = {
  article: { label: "文章", color: "text-sky-400" },
  course: { label: "課程", color: "text-violet-400" },
  qa: { label: "專家問答", color: "text-amber-400" },
};

export default function AcademyPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [activeType, setActiveType] = useState<"all" | "article" | "course" | "qa">("all");

  const filtered = CONTENT.filter((item) => {
    if (activeCategory !== "all" && item.category !== activeCategory) return false;
    if (activeType !== "all" && item.type !== activeType) return false;
    return true;
  });

  const completedCount = CONTENT.filter((c) => c.completed).length;
  const totalCourses = CONTENT.filter((c) => c.type === "course").length;

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white pb-28">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0a1a]/80 border-b border-white/[0.06]">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">學院</h1>
              <p className="text-[11px] text-slate-500">學習與成長</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{completedCount}/{CONTENT.length} 已完成</span>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-5 space-y-5">
        {/* Progress Card */}
        <div
          className="glass-card p-5 rounded-2xl"
          style={{ animation: "fadeSlideUp 0.5s ease-out" }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-300">學習進度</h2>
            <span className="text-xs text-violet-400 font-medium">
              {Math.round((completedCount / CONTENT.length) * 100)}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-pink-500 transition-all duration-700"
              style={{ width: `${(completedCount / CONTENT.length) * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
            <span>{completedCount} 已完成</span>
            <span>{totalCourses} 門課程</span>
          </div>
        </div>

        {/* Type Tabs */}
        <div
          className="flex gap-2"
          style={{ animation: "fadeSlideUp 0.5s ease-out 0.1s both" }}
        >
          {(["all", "article", "course", "qa"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all duration-300 ${
                activeType === type
                  ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                  : "glass-card text-slate-400 hover:text-white"
              }`}
            >
              {type === "all" ? "全部" : typeLabels[type].label}
            </button>
          ))}
        </div>

        {/* Category Filter */}
        <div
          className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
          style={{ animation: "fadeSlideUp 0.5s ease-out 0.15s both" }}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-300 ${
                activeCategory === cat.key
                  ? "bg-white/[0.1] text-white border border-white/[0.15]"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>

        {/* Content List */}
        <div className="space-y-3">
          {filtered.map((item, i) => (
            <div
              key={item.id}
              className={`glass-card-hover p-4 rounded-2xl transition-all duration-300 ${
                item.locked ? "opacity-60" : "cursor-pointer"
              }`}
              style={{ animation: `fadeSlideUp 0.5s ease-out ${0.2 + i * 0.05}s both` }}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    item.type === "article"
                      ? "bg-sky-500/10 text-sky-400"
                      : item.type === "course"
                      ? "bg-violet-500/10 text-violet-400"
                      : "bg-amber-500/10 text-amber-400"
                  }`}
                >
                  {item.locked ? <Lock className="w-5 h-5" /> : item.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${typeLabels[item.type].color}`}>
                      {typeLabels[item.type].label}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md border ${difficultyColors[item.difficulty]}`}>
                      {difficultyLabels[item.difficulty]}
                    </span>
                    {item.completed && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-white mb-1 leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                    {item.description}
                  </p>

                  {/* Expert badge */}
                  {item.expert && (
                    <div className="flex items-center gap-2 mt-2 text-[11px]">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                        <Stethoscope className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-amber-400 font-medium">{item.expert.name}</span>
                      <span className="text-slate-500">{item.expert.role}</span>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Clock className="w-3 h-3" />
                      {item.duration}
                    </div>
                    {item.locked ? (
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> 付費
                      </span>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">此分類暫無內容</p>
            <p className="text-slate-600 text-xs mt-1">更多內容即將推出</p>
          </div>
        )}

        {/* Featured Expert Section */}
        <div
          className="glass-card p-5 rounded-2xl"
          style={{ animation: "fadeSlideUp 0.5s ease-out 0.6s both" }}
        >
          <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400" />
            有問題想問？
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            匿名提交您的問題。我們的認證治療師、心理師和健康專業人士將提供專家指導。
          </p>
          <button className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 text-white text-sm font-semibold transition-all hover:shadow-[0_0_24px_rgba(139,92,246,0.3)]">
            匿名提問
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
