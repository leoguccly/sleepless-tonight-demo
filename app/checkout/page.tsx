"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { ArrowLeft, MapPin, CreditCard, Truck, Store, Package, Check, Loader2 } from "lucide-react";

const SHIPPING_METHODS = [
  { key: "home_delivery", label: "宅配到府", desc: "2-5 個工作天", icon: Truck },
  { key: "convenience_store", label: "超商取貨", desc: "隔日可取", icon: Store },
  { key: "post_office", label: "郵局", desc: "3-7 個工作天", icon: Package },
];

const PAYMENT_METHODS = [
  { key: "credit_card", label: "信用卡" },
  { key: "line_pay", label: "LINE Pay" },
  { key: "atm", label: "ATM" },
  { key: "convenience_store", label: "超商付款" },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalAmount, clearCart } = useCart();

  const [shippingName, setShippingName] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingMethod, setShippingMethod] = useState("home_delivery");
  const [paymentMethod, setPaymentMethod] = useState("credit_card");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handlePlaceOrder = async () => {
    if (!shippingName.trim() || !shippingPhone.trim() || !shippingAddress.trim()) {
      setError("請填寫完整的收件資訊");
      return;
    }
    if (items.length === 0) {
      setError("購物車是空的");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            name: i.name,
            price: i.price,
            image: i.image,
            quantity: i.quantity,
          })),
          shippingName: shippingName.trim(),
          shippingPhone: shippingPhone.trim(),
          shippingAddress: shippingAddress.trim(),
          shippingMethod,
          paymentMethod,
        }),
      });

      const data = await res.json();
      if (data.success) {
        clearCart();
        router.push(`/orders/${data.data.id}?new=true`);
      } else {
        setError(data.message || "下單失敗");
      }
    } catch {
      setError("網路錯誤，請稍後再試");
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0 && !submitting) {
    router.push("/cart");
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0f172a] pb-10">
      {/* Header */}
      <header className="sticky top-0 z-50 px-6 py-4 bg-[#0f172a]/80 backdrop-blur-2xl border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-xl hover:bg-white/[0.06] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <h1 className="text-base font-bold text-white">結帳</h1>
          <div className="w-9" />
        </div>
      </header>

      <div className="px-6 pt-6 space-y-5">
        {/* Shipping Info */}
        <div className="glass-card rounded-2xl p-5 animate-fade-up">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-white">收件資訊</h2>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="收件人姓名"
              value={shippingName}
              onChange={(e) => setShippingName(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-primary/30 focus:bg-white/[0.05] transition-all duration-200"
            />
            <input
              type="tel"
              placeholder="聯絡電話"
              value={shippingPhone}
              onChange={(e) => setShippingPhone(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-primary/30 focus:bg-white/[0.05] transition-all duration-200"
            />
            <textarea
              placeholder="配送地址"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              rows={2}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-primary/30 focus:bg-white/[0.05] transition-all duration-200 resize-none"
            />
          </div>
        </div>

        {/* Shipping Method */}
        <div className="glass-card rounded-2xl p-5 animate-fade-up" style={{ animationDelay: "0.06s" }}>
          <div className="flex items-center gap-2 mb-4">
            <Truck className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-white">配送方式</h2>
          </div>
          <div className="space-y-2">
            {SHIPPING_METHODS.map((method) => {
              const Icon = method.icon;
              const selected = shippingMethod === method.key;
              return (
                <button
                  key={method.key}
                  onClick={() => setShippingMethod(method.key)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200 ${
                    selected
                      ? "bg-primary/[0.08] border-primary/25"
                      : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    selected ? "bg-primary/20" : "bg-white/[0.04]"
                  }`}>
                    <Icon className={`w-4 h-4 ${selected ? "text-primary" : "text-slate-500"}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className={`text-sm font-medium ${selected ? "text-white" : "text-slate-400"}`}>{method.label}</div>
                    <div className="text-[11px] text-slate-600">{method.desc}</div>
                  </div>
                  {selected && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Payment Method */}
        <div className="glass-card rounded-2xl p-5 animate-fade-up" style={{ animationDelay: "0.12s" }}>
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-white">付款方式</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map((method) => {
              const selected = paymentMethod === method.key;
              return (
                <button
                  key={method.key}
                  onClick={() => setPaymentMethod(method.key)}
                  className={`p-3 rounded-xl border text-center transition-all duration-200 ${
                    selected
                      ? "bg-primary/[0.08] border-primary/25 text-primary"
                      : "bg-white/[0.02] border-white/[0.06] text-slate-500 hover:bg-white/[0.04]"
                  }`}
                >
                  <span className="text-xs font-semibold">{method.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Order Summary */}
        <div className="glass-card rounded-2xl p-5 animate-fade-up" style={{ animationDelay: "0.18s" }}>
          <h2 className="text-sm font-bold text-white mb-4">訂單摘要</h2>
          <div className="space-y-3 mb-4">
            {items.map((item) => (
              <div key={item.productId} className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.06] shrink-0 relative overflow-hidden">
                    {item.image.startsWith("http") ? (
                      <img src={item.image} alt={item.name} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-lg">{item.image}</div>
                    )}
                  </div>
                  <span className="text-sm text-slate-400 truncate">{item.name}</span>
                  <span className="text-xs text-slate-600 shrink-0">x{item.quantity}</span>
                </div>
                <span className="text-sm text-white font-semibold tabular-nums shrink-0">&yen;{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="h-px bg-white/[0.06] mb-3" />
          <div className="flex justify-between">
            <span className="text-white font-semibold">合計</span>
            <span className="text-xl font-extrabold text-gradient tabular-nums">&yen;{totalAmount}</span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl bg-red-400/[0.08] border border-red-400/[0.15] p-3 text-center">
            <span className="text-sm text-red-400">{error}</span>
          </div>
        )}

        {/* Privacy notice */}
        <p className="text-[11px] text-slate-700 text-center leading-relaxed px-4">
          所有訂單均以素面包裝出貨，外包裝不會顯示品牌或商品資訊，保障您的隱私。
        </p>

        {/* Place Order button */}
        <button
          onClick={handlePlaceOrder}
          disabled={submitting}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-rose-400 text-white font-semibold shadow-[0_8px_24px_rgba(255,136,130,0.3)] hover:shadow-[0_8px_32px_rgba(255,136,130,0.5)] transition-all duration-200 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              處理中...
            </>
          ) : (
            `確認下單 · ¥${totalAmount}`
          )}
        </button>
      </div>
    </div>
  );
}
