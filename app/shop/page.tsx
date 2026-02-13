"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import BottomNav from "@/components/layout/BottomNav";
import { useCart } from "@/lib/cart-context";
import Image from "next/image";
import { ShoppingBag, Star, Sparkles, Package, Check } from "lucide-react";

interface Product {
  id: number;
  name: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  category: string;
}

const CATEGORIES = [
  { key: "all", label: "全部" },
  { key: "好物", label: "好物" },
  { key: "推荐", label: "推薦" },
  { key: "新品", label: "新品" },
];

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [addedId, setAddedId] = useState<number | null>(null);
  const { addItem, totalItems } = useCart();

  useEffect(() => {
    fetchProducts(activeCategory);
  }, [activeCategory]);

  const fetchProducts = async (category: string) => {
    const url = category === "all"
      ? "/api/products"
      : `/api/products?category=${encodeURIComponent(category)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.success) setProducts(data.data);
  };

  const handleAddToCart = (product: Product) => {
    addItem({ id: product.id, name: product.name, price: product.price, image: product.image });
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1200);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] pb-28">
      {/* Header */}
      <header className="sticky top-0 z-50 px-6 py-4 bg-[#0f172a]/80 backdrop-blur-2xl border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">商城</h1>
            <p className="text-[11px] text-slate-600 font-medium tracking-wide">精選健康好物</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/orders"
              className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-all duration-200"
            >
              <Package className="w-5 h-5 text-slate-400" />
            </Link>
            <Link
              href="/cart"
              className="relative p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-all duration-200"
            >
              <ShoppingBag className="w-5 h-5 text-slate-300" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary rounded-lg text-[10px] font-bold text-white flex items-center justify-center shadow-[0_2px_8px_rgba(255,136,130,0.4)]">
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <div className="px-6 pt-6">
        {/* Banner */}
        <div className="mb-6 p-6 rounded-2xl glass-card relative overflow-hidden animate-fade-up">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.12] to-rose-500/[0.06]" />
          <div className="absolute top-3 right-3 opacity-[0.08]">
            <Sparkles className="w-20 h-20 text-primary" />
          </div>
          <div className="relative">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/20 border border-primary/20 text-[10px] font-bold text-primary uppercase tracking-wider mb-3">
              隱私優先
            </div>
            <h2 className="text-lg font-bold text-white mb-1.5">匿名配送</h2>
            <p className="text-sm text-slate-400 leading-relaxed">素面包裝 &middot; 無品牌標識 &middot; 超商取貨</p>
          </div>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 mb-5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 ${
                activeCategory === cat.key
                  ? "bg-primary/[0.15] text-primary border border-primary/25 shadow-[0_0_12px_rgba(255,136,130,0.15)]"
                  : "bg-white/[0.03] text-slate-500 border border-white/[0.06] hover:bg-white/[0.06] hover:text-slate-400"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Section title */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white tracking-tight">精選商品</h2>
          <span className="text-xs text-slate-600 font-medium">{products.length} 件商品</span>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 gap-4">
          {products.length === 0 ? (
            <div className="col-span-2 glass-card rounded-2xl p-10 text-center animate-fade-up">
              <ShoppingBag className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">此分類暫無商品</p>
            </div>
          ) : (
            products.map((product, idx) => {
              const justAdded = addedId === product.id;
              return (
                <div
                  key={product.id}
                  className="glass-card-hover rounded-2xl overflow-hidden animate-fade-up"
                  style={{ animationDelay: `${idx * 0.08}s` }}
                >
                  <Link href={`/shop/${product.id}`}>
                    <div className="aspect-square bg-gradient-to-br from-white/[0.06] to-white/[0.02] border-b border-white/[0.04] relative overflow-hidden group/img">
                      {product.image.startsWith("http") ? (
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover aspect-square w-full rounded-t-2xl transition-transform duration-500 group-hover/img:scale-110"
                          sizes="(max-width: 430px) 50vw, 200px"
                          unoptimized
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-5xl">
                          {product.image}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/10 pointer-events-none" />
                      {/* Glassmorphism overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/60 via-transparent to-white/[0.04] pointer-events-none" />
                      <div className="absolute inset-0 backdrop-blur-[0.5px] pointer-events-none opacity-30" />
                    </div>
                  </Link>
                  <div className="p-4">
                    <Link href={`/shop/${product.id}`}>
                      <h3 className="text-white font-semibold text-sm mb-2 leading-snug line-clamp-2 hover:text-primary transition-colors">{product.name}</h3>
                    </Link>
                    <div className="flex items-center gap-1.5 mb-3">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-semibold text-slate-300">{product.rating}</span>
                      <span className="text-[10px] text-slate-600">({product.reviews})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-extrabold text-gradient tabular-nums">&yen;{product.price}</span>
                      <button
                        onClick={() => handleAddToCart(product)}
                        className={`p-2 rounded-xl border transition-all duration-200 active:scale-90 ${
                          justAdded
                            ? "bg-emerald-400/[0.15] border-emerald-400/25 text-emerald-400"
                            : "bg-primary/[0.12] border-primary/20 text-primary hover:bg-primary/25"
                        }`}
                      >
                        {justAdded ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
