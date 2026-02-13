"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/layout/BottomNav";
import { ArrowLeft, Package, ChevronRight, Clock, CheckCircle2, Truck, XCircle } from "lucide-react";

interface OrderItem {
  id: string;
  productName: string;
  productImage: string;
  quantity: number;
  subtotal: number;
}

interface Order {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  shippingMethod: string;
  createdAt: string;
  items: OrderItem[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "待處理", color: "text-amber-400", icon: Clock },
  paid: { label: "已付款", color: "text-sky-400", icon: CheckCircle2 },
  processing: { label: "處理中", color: "text-violet-400", icon: Package },
  shipped: { label: "已出貨", color: "text-primary", icon: Truck },
  delivered: { label: "已送達", color: "text-emerald-400", icon: CheckCircle2 },
  cancelled: { label: "已取消", color: "text-red-400", icon: XCircle },
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const res = await fetch("/api/orders");
    const data = await res.json();
    if (data.success) setOrders(data.data);
    setLoading(false);
  };

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
          <h1 className="text-base font-bold text-white">訂單紀錄</h1>
          <span className="text-xs text-slate-600 font-medium">{orders.length} 筆訂單</span>
        </div>
      </header>

      <div className="px-6 pt-6">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="glass-card rounded-2xl p-10 text-center animate-fade-up">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
              <Package className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium mb-1">尚無訂單</p>
            <p className="text-slate-600 text-sm mb-5">您的訂單紀錄會顯示在這裡</p>
            <Link
              href="/shop"
              className="inline-flex px-5 py-2.5 rounded-xl bg-primary/[0.12] border border-primary/20 text-sm text-primary font-medium hover:bg-primary/25 transition-all duration-200"
            >
              前往商店
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, idx) => {
              const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const StatusIcon = config.icon;
              const date = new Date(order.createdAt);

              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="block glass-card-hover rounded-2xl p-5 animate-fade-up"
                  style={{ animationDelay: `${idx * 0.06}s` }}
                >
                  {/* Order header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-600 font-mono">{order.orderNumber}</span>
                    </div>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06]`}>
                      <StatusIcon className={`w-3 h-3 ${config.color}`} />
                      <span className={`text-[10px] font-semibold ${config.color}`}>{config.label}</span>
                    </div>
                  </div>

                  {/* Items preview */}
                  <div className="flex items-center gap-2 mb-4">
                    {order.items.slice(0, 4).map((item) => (
                      <div
                        key={item.id}
                        className="w-12 h-12 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-xl"
                      >
                        {item.productImage}
                      </div>
                    ))}
                    {order.items.length > 4 && (
                      <div className="w-12 h-12 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                        <span className="text-[10px] text-slate-500 font-semibold">+{order.items.length - 4}</span>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
                    <div>
                      <span className="text-xs text-slate-600">
                        {date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      <span className="text-slate-700 mx-2">&middot;</span>
                      <span className="text-xs text-slate-600">{order.items.length} 件商品</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-extrabold text-gradient tabular-nums">&yen;{order.totalAmount}</span>
                      <ChevronRight className="w-4 h-4 text-slate-700" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
