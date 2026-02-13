"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/cart-context";
import {
  ArrowLeft,
  Star,
  ShoppingBag,
  Check,
  Shield,
  Truck,
  Package,
  Heart,
  Share2,
  ChevronRight,
  Loader2,
} from "lucide-react";

interface Product {
  id: number;
  name: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  category: string;
}

const FEATURES = [
  { icon: <Shield className="w-4 h-4" />, label: "安全認證", desc: "醫療級材質" },
  { icon: <Truck className="w-4 h-4" />, label: "匿名配送", desc: "素面包裝，無品牌標識" },
  { icon: <Package className="w-4 h-4" />, label: "超商取貨", desc: "便利商店可取" },
];

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetch(`/api/products/${params.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setProduct(data.data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [params.id]);

  const handleAddToCart = () => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) {
      addItem({ id: product.id, name: product.name, price: product.price, image: product.image });
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex flex-col items-center justify-center gap-4 text-white">
        <Package className="w-12 h-12 text-slate-600" />
        <p className="text-slate-400">找不到此商品</p>
        <Link href="/shop" className="text-primary text-sm hover:underline">
          返回商城
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white pb-32">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0a1a]/80 border-b border-white/[0.06]">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-slate-300" />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLiked(!liked)}
              className={`p-2 rounded-xl border transition-all duration-300 ${
                liked
                  ? "bg-rose-500/15 border-rose-500/25 text-rose-400"
                  : "bg-white/[0.04] border-white/[0.08] text-slate-400 hover:text-white"
              }`}
            >
              <Heart className={`w-5 h-5 ${liked ? "fill-current" : ""}`} />
            </button>
            <button className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:text-white transition-all">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto">
        {/* Product Image */}
        <div
          className="aspect-square bg-gradient-to-br from-white/[0.06] to-white/[0.02] border-b border-white/[0.06] relative overflow-hidden"
          style={{ animation: "fadeSlideUp 0.5s ease-out" }}
        >
          {product.image.startsWith("http") ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 430px) 100vw, 430px"
              priority
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-8xl">
              {product.image}
            </div>
          )}
          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a1a]/70 via-transparent to-white/[0.03] pointer-events-none" />
          <div className="absolute top-4 left-4 z-10">
            <span className="px-3 py-1 rounded-lg bg-black/30 border border-white/[0.15] text-[11px] font-semibold text-white backdrop-blur-md">
              {product.category}
            </span>
          </div>
        </div>

        <div className="px-5 pt-5 space-y-5">
          {/* Title & Price */}
          <div style={{ animation: "fadeSlideUp 0.5s ease-out 0.1s both" }}>
            <h1 className="text-xl font-bold text-white mb-2 leading-tight">{product.name}</h1>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-sm font-semibold text-white">{product.rating}</span>
              </div>
              <span className="text-xs text-slate-500">{product.reviews} 則評價</span>
              <span className="text-xs text-slate-600">|</span>
              <span className="text-xs text-emerald-400">有貨</span>
            </div>
            <p className="text-3xl font-extrabold text-gradient">&yen;{product.price}</p>
          </div>

          {/* Description */}
          <div
            className="glass-card p-4 rounded-2xl"
            style={{ animation: "fadeSlideUp 0.5s ease-out 0.2s both" }}
          >
            <h2 className="text-sm font-semibold text-slate-300 mb-2">商品介紹</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              為您的健康旅程精心挑選的優質商品。採用身體安全、醫療級材質製成。每件商品都經過嚴格的品質檢測，確保您的安全與滿意。
            </p>
          </div>

          {/* Features */}
          <div
            className="space-y-2"
            style={{ animation: "fadeSlideUp 0.5s ease-out 0.3s both" }}
          >
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-center gap-3 glass-card p-3 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  {f.icon}
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">{f.label}</p>
                  <p className="text-[11px] text-slate-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Reviews Preview */}
          <div
            className="glass-card p-4 rounded-2xl"
            style={{ animation: "fadeSlideUp 0.5s ease-out 0.4s both" }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-300">評價 ({product.reviews})</h2>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= Math.round(product.rating)
                        ? "text-amber-400 fill-amber-400"
                        : "text-slate-600"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-bold text-white">{product.rating}</span>
              <span className="text-xs text-slate-500">滿分 5 分</span>
            </div>
            {/* Sample reviews */}
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-400 to-pink-400" />
                  <span className="text-[11px] text-slate-400">匿名用戶</span>
                  <div className="flex ml-auto">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-3 h-3 ${s <= 5 ? "text-amber-400 fill-amber-400" : "text-slate-600"}`} />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-400">品質很好，配送快速。對商品非常滿意。</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-sky-400 to-emerald-400" />
                  <span className="text-[11px] text-slate-400">匿名用戶</span>
                  <div className="flex ml-auto">
                    {[1, 2, 3, 4].map((s) => (
                      <Star key={s} className="w-3 h-3 text-amber-400 fill-amber-400" />
                    ))}
                    <Star className="w-3 h-3 text-slate-600" />
                  </div>
                </div>
                <p className="text-xs text-slate-400">包裝如承諾般謹慎。會再次購買。</p>
              </div>
            </div>
          </div>

          {/* Quantity Selector */}
          <div
            className="glass-card p-4 rounded-2xl"
            style={{ animation: "fadeSlideUp 0.5s ease-out 0.5s both" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-300">數量</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.1] text-white font-bold flex items-center justify-center hover:bg-white/[0.1] transition-all"
                >
                  -
                </button>
                <span className="text-lg font-bold text-white w-8 text-center tabular-nums">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(10, quantity + 1))}
                  className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.1] text-white font-bold flex items-center justify-center hover:bg-white/[0.1] transition-all"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#0a0a1a]/90 border-t border-white/[0.06]">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-[11px] text-slate-500 mb-0.5">合計</p>
            <p className="text-xl font-extrabold text-gradient tabular-nums">
              &yen;{product.price * quantity}
            </p>
          </div>
          <button
            onClick={handleAddToCart}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
              added
                ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                : "bg-gradient-to-r from-primary to-rose-500 text-white shadow-[0_4px_20px_rgba(255,136,130,0.3)] hover:shadow-[0_4px_30px_rgba(255,136,130,0.5)] active:scale-[0.97]"
            }`}
          >
            {added ? (
              <>
                <Check className="w-5 h-5" />
                已加入！
              </>
            ) : (
              <>
                <ShoppingBag className="w-5 h-5" />
                加入購物車
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
