"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, CheckCircle2, Clock, Truck, XCircle, MapPin, CreditCard, PartyPopper } from "lucide-react";

interface OrderItem {
  id: string;
  productName: string;
  productImage: string;
  productPrice: number;
  quantity: number;
  subtotal: number;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingMethod: string;
  paymentMethod: string;
  trackingNumber: string | null;
  createdAt: string;
  paidAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  items: OrderItem[];
}

const STATUS_STEPS = ["paid", "processing", "shipped", "delivered"];
const STATUS_LABELS: Record<string, string> = {
  pending: "待處理",
  paid: "已付款",
  processing: "處理中",
  shipped: "已出貨",
  delivered: "已送達",
  cancelled: "已取消",
};

const SHIPPING_LABELS: Record<string, string> = {
  home_delivery: "宅配到府",
  convenience_store: "超商取貨",
  post_office: "郵局",
};

const PAYMENT_LABELS: Record<string, string> = {
  credit_card: "信用卡",
  line_pay: "LINE Pay",
  atm: "ATM",
  convenience_store: "超商付款",
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isNew = searchParams.get("new") === "true";
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchOrder(id);
  }, [id]);

  const fetchOrder = async (orderId: string) => {
    const res = await fetch(`/api/orders/${orderId}`);
    const data = await res.json();
    if (data.success) setOrder(data.data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">找不到訂單</p>
          <button onClick={() => router.push("/orders")} className="text-primary text-sm font-medium">
            返回訂單列表
          </button>
        </div>
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.indexOf(order.status);
  const date = new Date(order.createdAt);

  return (
    <div className="min-h-screen bg-[#0f172a] pb-10">
      {/* Header */}
      <header className="sticky top-0 z-50 px-6 py-4 bg-[#0f172a]/80 backdrop-blur-2xl border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/orders")}
            className="p-2 -ml-2 rounded-xl hover:bg-white/[0.06] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <h1 className="text-base font-bold text-white">訂單詳情</h1>
          <div className="w-9" />
        </div>
      </header>

      <div className="px-6 pt-6 space-y-5">
        {/* Success Banner (for new orders) */}
        {isNew && (
          <div className="glass-card rounded-2xl p-6 text-center animate-fade-up border-primary/20">
            <div className="w-14 h-14 rounded-2xl bg-emerald-400/[0.12] flex items-center justify-center mx-auto mb-3">
              <PartyPopper className="w-7 h-7 text-emerald-400" />
            </div>
            <h2 className="text-lg font-bold text-white mb-1">下單成功！</h2>
            <p className="text-sm text-slate-500">您的訂單正在處理中，採用隱密包裝</p>
          </div>
        )}

        {/* Order Number & Status */}
        <div className="glass-card rounded-2xl p-5 animate-fade-up" style={{ animationDelay: isNew ? "0.1s" : "0s" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-600 font-mono">{order.orderNumber}</span>
            <span className="text-xs text-slate-600">
              {date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>

          {/* Progress Steps */}
          {order.status !== "cancelled" && (
            <div className="flex items-center gap-1 mt-4">
              {STATUS_STEPS.map((step, i) => {
                const active = i <= currentStepIndex;
                return (
                  <div key={step} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className={`h-1 w-full rounded-full ${
                      active ? "bg-gradient-to-r from-primary to-rose-400" : "bg-white/[0.06]"
                    }`} />
                    <span className={`text-[9px] font-semibold uppercase tracking-wider ${
                      active ? "text-primary" : "text-slate-700"
                    }`}>
                      {STATUS_LABELS[step]}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {order.status === "cancelled" && (
            <div className="flex items-center gap-2 mt-3 p-3 rounded-xl bg-red-400/[0.08] border border-red-400/[0.15]">
              <XCircle className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-400 font-medium">訂單已取消</span>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="glass-card rounded-2xl p-5 animate-fade-up" style={{ animationDelay: "0.06s" }}>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">商品 ({order.items.length})</h3>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-xl shrink-0">
                  {item.productImage}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-medium truncate">{item.productName}</div>
                  <div className="text-xs text-slate-600">數量：{item.quantity} &middot; 單價 &yen;{item.productPrice}</div>
                </div>
                <span className="text-sm text-white font-semibold tabular-nums shrink-0">&yen;{item.subtotal}</span>
              </div>
            ))}
          </div>
          <div className="h-px bg-white/[0.06] my-4" />
          <div className="flex justify-between">
            <span className="text-sm text-white font-semibold">合計</span>
            <span className="text-lg font-extrabold text-gradient tabular-nums">&yen;{order.totalAmount}</span>
          </div>
        </div>

        {/* Shipping & Payment Info */}
        <div className="glass-card rounded-2xl p-5 animate-fade-up" style={{ animationDelay: "0.12s" }}>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <div className="text-xs text-slate-600 font-medium mb-0.5">收件資訊</div>
                <div className="text-sm text-white">{order.shippingName} &middot; {order.shippingPhone}</div>
                <div className="text-xs text-slate-500 mt-0.5">{order.shippingAddress}</div>
                <div className="text-[11px] text-slate-600 mt-1">{SHIPPING_LABELS[order.shippingMethod] || order.shippingMethod}</div>
              </div>
            </div>

            {order.trackingNumber && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <div className="text-xs text-slate-600 font-medium mb-0.5">物流單號</div>
                  <div className="text-sm text-white font-mono">{order.trackingNumber}</div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <div className="text-xs text-slate-600 font-medium mb-0.5">付款方式</div>
                <div className="text-sm text-white">{PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href="/shop"
            className="flex-1 py-3.5 rounded-2xl glass-card text-center text-sm text-slate-400 font-medium hover:bg-white/[0.06] transition-all duration-200"
          >
            繼續購物
          </Link>
          <Link
            href="/orders"
            className="flex-1 py-3.5 rounded-2xl bg-primary/[0.12] border border-primary/20 text-center text-sm text-primary font-medium hover:bg-primary/25 transition-all duration-200"
          >
            所有訂單
          </Link>
        </div>
      </div>
    </div>
  );
}
