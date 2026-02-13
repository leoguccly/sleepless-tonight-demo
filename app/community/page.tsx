"use client";

import { useState, useEffect } from "react";
import BottomNav from "@/components/layout/BottomNav";
import { Heart, MessageCircle, Plus, Send, Flag, Trash2, X, ChevronDown, ChevronUp } from "lucide-react";

interface Post {
  id: string;
  content: string;
  postType: string;
  likesCount: number;
  repliesCount: number;
  createdAt: string;
}

interface Reply {
  id: string;
  content: string;
  anonymousAvatarSeed: string;
  createdAt: string;
}

const SORT_TABS = [
  { key: "trending", label: "熱門" },
  { key: "latest", label: "最新" },
];

const TYPE_TABS = [
  { key: "all", label: "全部" },
  { key: "experience", label: "經驗分享" },
  { key: "question", label: "問題求助" },
  { key: "success", label: "成功故事" },
];

const POST_TYPES = [
  { key: "experience", label: "經驗分享" },
  { key: "question", label: "問題求助" },
  { key: "success", label: "成功故事" },
];

const REPORT_REASONS = ["垃圾訊息", "騷擾", "不當內容", "錯誤資訊", "其他"];

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState("experience");
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [activeSort, setActiveSort] = useState("trending");
  const [activeType, setActiveType] = useState("all");

  // Reply state - use per-post content map to avoid cross-post state issues
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [replies, setReplies] = useState<Record<string, Reply[]>>({});
  const [replyContents, setReplyContents] = useState<Record<string, string>>({});
  const [sendingReply, setSendingReply] = useState(false);

  // Report state
  const [reportPostId, setReportPostId] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, [activeSort, activeType]);

  const fetchPosts = async () => {
    const params = new URLSearchParams();
    params.set("sort", activeSort);
    if (activeType !== "all") params.set("type", activeType);
    const res = await fetch(`/api/posts?${params}`);
    const data = await res.json();
    if (data.success) setPosts(data.data);
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, postType }),
    });
    const data = await res.json();
    if (data.success) {
      setContent("");
      setShowModal(false);
      await fetchPosts();
    }
  };

  const handleLike = async (postId: string) => {
    const isLiked = likedPosts.has(postId);
    const newLiked = new Set(likedPosts);
    if (isLiked) newLiked.delete(postId);
    else newLiked.add(postId);
    setLikedPosts(newLiked);

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, likesCount: p.likesCount + (isLiked ? -1 : 1) } : p
      )
    );

    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
      const data = await res.json();
      if (!data.success) {
        setLikedPosts(likedPosts);
        await fetchPosts();
      }
    } catch {
      setLikedPosts(likedPosts);
      await fetchPosts();
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("確定要刪除這則貼文嗎？")) return;
    const res = await fetch("/api/posts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: postId }),
    });
    const data = await res.json();
    if (data.success) setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleToggleReplies = async (postId: string) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
      return;
    }
    setExpandedPost(postId);
    if (!replies[postId]) {
      const res = await fetch(`/api/posts/${postId}/replies`);
      const data = await res.json();
      if (data.success) setReplies((prev) => ({ ...prev, [postId]: data.data }));
    }
  };

  const handleReply = async (postId: string) => {
    const text = (replyContents[postId] || "").trim();
    if (!text || sendingReply) return;
    setSendingReply(true);
    try {
      const res = await fetch(`/api/posts/${postId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(`回覆失敗：${data.message || "伺服器錯誤"}`);
        return;
      }
      setReplies((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), data.data],
      }));
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, repliesCount: p.repliesCount + 1 } : p))
      );
      setReplyContents((prev) => ({ ...prev, [postId]: "" }));
    } catch (error) {
      alert(`回覆失敗：${error instanceof Error ? error.message : "網路錯誤"}`);
    } finally {
      setSendingReply(false);
    }
  };

  const handleReport = async (postId: string, reason: string) => {
    const res = await fetch(`/api/posts/${postId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();
    if (data.success) {
      setReportPostId(null);
      alert("檢舉已提交，謝謝你。");
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] pb-28">
      {/* Header */}
      <header className="sticky top-0 z-50 px-6 py-4 bg-[#0f172a]/80 backdrop-blur-2xl border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">社群</h1>
            <p className="text-[11px] text-slate-600 font-medium tracking-wide">安全 &middot; 匿名 &middot; 支持</p>
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
        {/* Sort Tabs */}
        <div className="flex gap-2 mb-3">
          {SORT_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveSort(tab.key)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 ${
                activeSort === tab.key
                  ? "bg-primary/[0.15] text-primary border border-primary/25 shadow-[0_0_12px_rgba(255,136,130,0.15)]"
                  : "bg-white/[0.03] text-slate-500 border border-white/[0.06] hover:bg-white/[0.06]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Type Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveType(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all duration-200 ${
                activeType === tab.key
                  ? "bg-white/[0.08] text-white border border-white/[0.12]"
                  : "text-slate-600 hover:text-slate-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Posts */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="glass-card rounded-2xl p-10 text-center animate-fade-up">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-7 h-7 text-slate-600" />
              </div>
              <p className="text-slate-400 font-medium mb-1">還沒有貼文</p>
              <p className="text-slate-600 text-sm">成為第一個分享的人</p>
            </div>
          ) : (
            posts.map((post, idx) => {
              const isLiked = likedPosts.has(post.id);
              const isExpanded = expandedPost === post.id;
              const postReplies = replies[post.id] || [];

              return (
                <div
                  key={post.id}
                  className="glass-card-hover rounded-2xl p-5 animate-fade-up"
                  style={{ animationDelay: `${idx * 0.06}s` }}
                >
                  {/* User row */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center border border-white/[0.08]">
                      <span className="text-xs font-bold text-gradient">A</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white">匿名使用者</div>
                      <div className="text-[11px] text-slate-600 font-medium">
                        {new Date(post.createdAt).toLocaleString("zh-TW", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.06]">
                        <span className="text-[10px] text-slate-600 font-medium">{post.postType}</span>
                      </div>
                      {/* Report */}
                      <button
                        onClick={() => setReportPostId(post.id)}
                        className="p-1 rounded-lg text-slate-700 hover:text-amber-400 hover:bg-amber-400/[0.1] transition-all"
                      >
                        <Flag className="w-3 h-3" />
                      </button>
                      {/* Delete own */}
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="p-1 rounded-lg text-slate-700 hover:text-red-400 hover:bg-red-400/[0.1] transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <p className="text-slate-300 text-[13px] leading-relaxed mb-4">{post.content}</p>

                  <div className="h-px bg-white/[0.04] mb-3" />

                  {/* Actions */}
                  <div className="flex items-center gap-5">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-2 transition-all duration-200 group ${
                        isLiked ? "text-rose-400" : "text-slate-500 hover:text-rose-400"
                      }`}
                    >
                      <Heart className={`w-4 h-4 group-hover:scale-110 transition-transform ${isLiked ? "fill-rose-400" : ""}`} />
                      <span className="text-xs font-semibold tabular-nums">{post.likesCount}</span>
                    </button>
                    <button
                      onClick={() => handleToggleReplies(post.id)}
                      className="flex items-center gap-2 text-slate-500 hover:text-sky-400 transition-colors duration-200 group"
                    >
                      <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-semibold tabular-nums">{post.repliesCount}</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>

                  {/* Replies Section */}
                  {isExpanded && (
                    <div className="mt-4 pt-3 border-t border-white/[0.04]">
                      {postReplies.length > 0 && (
                        <div className="space-y-3 mb-3">
                          {postReplies.map((reply) => (
                            <div key={reply.id} className="flex gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
                                <span className="text-[9px] font-bold text-slate-500">A</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-slate-300 leading-relaxed">{reply.content}</p>
                                <span className="text-[10px] text-slate-700 mt-1 block">
                                  {new Date(reply.createdAt).toLocaleString("zh-TW", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reply input */}
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={replyContents[post.id] || ""}
                          onChange={(e) => setReplyContents((prev) => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === "Enter" && (replyContents[post.id] || "").trim()) handleReply(post.id); }}
                          placeholder="寫下你的回覆..."
                          className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-primary/30 transition-all"
                        />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleReply(post.id); }}
                          disabled={sendingReply}
                          className={`p-2 rounded-xl border transition-all ${
                            (replyContents[post.id] || "").trim()
                              ? "bg-primary/[0.15] border-primary/25 text-primary cursor-pointer hover:bg-primary/25"
                              : "bg-white/[0.03] border-white/[0.06] text-slate-600 cursor-not-allowed"
                          }`}
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
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

      {/* Post Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[10000] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-[430px] bg-[#0f172a]/95 backdrop-blur-2xl rounded-t-3xl border-t border-white/[0.1] shadow-[0_-8px_40px_rgba(0,0,0,0.5)] max-h-[85vh] flex flex-col animate-fade-up">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 bg-white/[0.1] rounded-full" />
            </div>
            {/* Header with publish button on right */}
            <div className="px-6 pb-4 flex items-start justify-between shrink-0">
              <div>
                <h2 className="text-lg font-bold text-white mb-0.5">新貼文</h2>
                <p className="text-xs text-slate-600 font-medium">匿名且加密</p>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-slate-400 font-medium hover:bg-white/[0.08] transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!content.trim()}
                  className="px-4 py-2 rounded-xl bg-rose-400 text-xs text-white font-bold shadow-[0_4px_16px_rgba(251,113,133,0.4)] hover:bg-rose-500 disabled:opacity-40 disabled:shadow-none transition-all flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  發佈
                </button>
              </div>
            </div>
            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto min-h-0 px-6 pb-[100px]">
              {/* Post type selector */}
              <div className="flex gap-2 mb-4">
                {POST_TYPES.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setPostType(t.key)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                      postType === t.key
                        ? "bg-primary/[0.15] text-primary border border-primary/25"
                        : "bg-white/[0.03] text-slate-500 border border-white/[0.06]"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="分享你的想法..."
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl px-4 py-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-primary/30 focus:bg-white/[0.05] transition-all duration-200 h-40 resize-none"
                autoFocus
              />
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportPostId && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setReportPostId(null)} />
          <div className="relative w-[90%] max-w-[360px] bg-[#0f172a]/95 backdrop-blur-2xl rounded-2xl border border-white/[0.1] p-6 animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">檢舉貼文</h3>
              <button onClick={() => setReportPostId(null)} className="p-1 rounded-lg hover:bg-white/[0.06]">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <p className="text-xs text-slate-600 mb-4">選擇檢舉原因：</p>
            <div className="space-y-2">
              {REPORT_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => handleReport(reportPostId, reason)}
                  className="w-full text-left px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-slate-300 hover:bg-white/[0.06] transition-all capitalize"
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
