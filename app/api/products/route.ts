import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const where = category && category !== "all"
      ? { category }
      : {};

    const products = await prisma.product.findMany({
      where,
      orderBy: { rating: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Products Error:", error);
    return NextResponse.json(
      { success: false, message: "获取商品失败" },
      { status: 500 }
    );
  }
}
