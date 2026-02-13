import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function generateOrderNumber(): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const rand = String(Math.floor(Math.random() * 999999)).padStart(6, "0");
  return `PP${y}${m}${d}${rand}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, shippingName, shippingPhone, shippingAddress, shippingMethod, paymentMethod } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, message: "Cart is empty" }, { status: 400 });
    }
    if (!shippingName || !shippingPhone || !shippingAddress) {
      return NextResponse.json({ success: false, message: "Shipping info required" }, { status: 400 });
    }

    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({ data: { email: "default@example.com" } });
    }

    const totalAmount = items.reduce(
      (sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity,
      0
    );

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        orderNumber: generateOrderNumber(),
        totalAmount,
        shippingName,
        shippingPhone,
        shippingAddress,
        shippingMethod: shippingMethod || "home_delivery",
        paymentMethod: paymentMethod || "credit_card",
        status: "paid",
        paidAt: new Date(),
        items: {
          create: items.map((item: { productId: number; name: string; price: number; image: string; quantity: number }) => ({
            productId: item.productId,
            productName: item.name,
            productPrice: item.price,
            productImage: item.image,
            quantity: item.quantity,
            subtotal: item.price * item.quantity,
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error("Create Order Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create order" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      return NextResponse.json({ success: true, data: [] });
    }

    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: {
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    console.error("List Orders Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
