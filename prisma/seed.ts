import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 创建默认用户
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: { email: "default@example.com" },
    });
  }

  // 创建商品数据
  const products = [
    { name: "智能按摩棒", price: 899, rating: 4.9, reviews: 1234, image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=800", category: "好物" },
    { name: "震動按摩器 Pro", price: 1299, rating: 4.9, reviews: 2345, image: "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&q=80&w=800", category: "好物" },
    { name: "真絲情趣內衣", price: 599, rating: 4.8, reviews: 567, image: "https://images.unsplash.com/photo-1582095252086-79f97906d28c?auto=format&fit=crop&q=80&w=800", category: "推荐" },
    { name: "玫瑰精油禮盒", price: 399, rating: 4.8, reviews: 789, image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=800", category: "新品" },
    { name: "浪漫香氛蠟燭", price: 299, rating: 4.7, reviews: 890, image: "https://images.unsplash.com/photo-1602873145311-48258dc1e39d?auto=format&fit=crop&q=80&w=800", category: "新品" },
    { name: "真絲睡眠眼罩", price: 199, rating: 4.6, reviews: 456, image: "https://images.unsplash.com/photo-1531353826977-0941b4779a1c?auto=format&fit=crop&q=80&w=800", category: "推荐" },
  ];

  for (const product of products) {
    const existing = await prisma.product.findFirst({
      where: { name: product.name },
    });
    if (!existing) {
      await prisma.product.create({
        data: {
          name: product.name,
          price: product.price,
          rating: product.rating,
          reviews: product.reviews,
          image: product.image,
          category: product.category,
        },
      });
    }
  }

  console.log("Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
