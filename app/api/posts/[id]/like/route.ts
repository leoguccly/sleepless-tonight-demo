import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;

    // Get or create default user
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: { email: "default@example.com" },
      });
    }

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: user.id,
          postId,
        },
      },
    });

    if (existingLike) {
      // Unlike: remove like and decrement count
      await prisma.like.delete({ where: { id: existingLike.id } });
      await prisma.post.update({
        where: { id: postId },
        data: { likesCount: { decrement: 1 } },
      });

      return NextResponse.json({
        success: true,
        liked: false,
        message: "Unliked",
      });
    } else {
      // Like: create like and increment count
      await prisma.like.create({
        data: {
          userId: user.id,
          postId,
        },
      });
      await prisma.post.update({
        where: { id: postId },
        data: { likesCount: { increment: 1 } },
      });

      return NextResponse.json({
        success: true,
        liked: true,
        message: "Liked",
      });
    }
  } catch (error) {
    console.error("Like Error:", error);
    return NextResponse.json(
      { success: false, message: "操作失败" },
      { status: 500 }
    );
  }
}
