"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/layout/BottomNav";
import { useCart } from "@/lib/cart-context";
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, totalItems, totalAmount } = useCart();

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
          <h1 className="text-base font-bold text-white">購物車</h1>
          <span className="text-xs text-slate-600 font-medium">{totalItems} 件商品</span>
        </div>
      </header>

      <div className="px-6 pt-6">
        {items.length === 0 ? (
          <div className="glass-card rounded-2xl p-10 text-center animate-fade-up">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium mb-1">購物車是空的</p>
            <p className="text-slate-600 text-sm mb-5">前往商店瀏覽商品</p>
            <Link
              href="/shop"
              className="inline-flex px-5 py-2.5 rounded-xl bg-primary/[0.12] border border-primary/20 text-sm text-primary font-medium hover:bg-primary/25 transition-all duration-200"
            >
              前往商店
            </Link>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="space-y-3 mb-6">
              {items.map((item, idx) => (
                <div
                  key={item.productId}
                  className="glass-card-hover rounded-2xl p-4 animate-fade-up"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="flex gap-4">
                    {/* Product image */}
                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.06] shrink-0 relative overflow-hidden">
                      {item.image.startsWith("http") ? (
                        <img src={item.image} alt={item.name} className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-3xl">{item.image}</div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/40 to-transparent pointer-events-none" />
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2 mb-1.5">{item.name}</h3>
                      <div className="text-lg font-extrabold text-gradient tabular-nums">&yen;{item.price}</div>
                    </div>
                    {/* Delete */}
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="self-start p-1.5 rounded-lg text-slate-700 hover:text-red-400 hover:bg-red-400/[0.1] transition-all duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {/* Quantity controls */}
                  <div className="flex items-center justify-end gap-3 mt-3 pt-3 border-t border-white/[0.04]">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-400 hover:bg-white/[0.08] transition-all"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-sm font-bold text-white tabular-nums w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="w-8 h-8 rounded-lg bg-primary/[0.12] border border-primary/20 flex items-center justify-center text-primary hover:bg-primary/25 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="glass-card rounded-2xl p-5 mb-6 animate-fade-up" style={{ animationDelay: "0.2s" }}>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">小計 ({totalItems} 件商品)</span>
                  <span className="text-white font-semibold tabular-nums">&yen;{totalAmount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">運費</span>
                  <span className="text-emerald-400 font-medium">免費</span>
                </div>
                <div className="h-px bg-white/[0.06]" />
                <div className="flex justify-between">
                  <span className="text-white font-semibold">合計</span>
                  <span className="text-xl font-extrabold text-gradient tabular-nums">&yen;{totalAmount}</span>
                </div>
              </div>
            </div>

            {/* Checkout button */}
            <Link
              href="/checkout"
              className="block w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-rose-400 text-center text-white font-semibold shadow-[0_8px_24px_rgba(255,136,130,0.3)] hover:shadow-[0_8px_32px_rgba(255,136,130,0.5)] transition-all duration-200 animate-fade-up"
              style={{ animationDelay: "0.25s" }}
            >
              結帳 &middot; &yen;{totalAmount}
            </Link>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
