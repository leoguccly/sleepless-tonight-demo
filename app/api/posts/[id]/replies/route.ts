import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const replies = await prisma.reply.findMany({
      where: { postId: params.id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, data: replies });
  } catch (error) {
    console.error("Replies Error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch replies" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { content } = await request.json();
    if (!content || !content.trim()) {
      return NextResponse.json({ success: false, message: "Content required" }, { status: 400 });
    }

    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({ data: { email: "default@example.com" } });
    }

    const reply = await prisma.reply.create({
      data: {
        postId: params.id,
        userId: user.id,
        anonymousAvatarSeed: Math.random().toString(36).substring(2, 8),
        content: content.trim(),
      },
    });

    // Increment replies count
    await prisma.post.update({
      where: { id: params.id },
      data: { repliesCount: { increment: 1 } },
    });

    return NextResponse.json({ success: true, data: reply });
  } catch (error) {
    console.error("Create Reply Error:", error);
    return NextResponse.json({ success: false, message: "Failed to create reply" }, { status: 500 });
  }
}
