import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const postType = request.nextUrl.searchParams.get("type");
    const sort = request.nextUrl.searchParams.get("sort") || "latest";

    const where: Record<string, unknown> = {
      deletedAt: null,
      moderationStatus: "approved",
    };

    if (postType && postType !== "all") {
      where.postType = postType;
    }

    let orderBy: Record<string, string>;
    if (sort === "trending") {
      orderBy = { likesCount: "desc" };
    } else {
      orderBy = { createdAt: "desc" };
    }

    const posts = await prisma.post.findMany({
      where,
      orderBy,
      take: 30,
    });

    return NextResponse.json({ success: true, data: posts });
  } catch (error) {
    console.error("Posts Error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, postType } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ success: false, message: "Content required" }, { status: 400 });
    }

    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({ data: { email: "default@example.com" } });
    }

    const post = await prisma.post.create({
      data: {
        userId: user.id,
        anonymousId: `anon_${Date.now()}`,
        anonymousAvatarSeed: Math.random().toString(36).substring(2, 8),
        content: content.trim(),
        postType: postType || "experience",
        moderationStatus: "approved",
      },
    });

    return NextResponse.json({ success: true, data: post });
  } catch (error) {
    console.error("Post Error:", error);
    return NextResponse.json({ success: false, message: "Failed to create post" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, message: "Post ID required" }, { status: 400 });
    }

    await prisma.post.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true, message: "Post deleted" });
  } catch (error) {
    console.error("Delete Post Error:", error);
    return NextResponse.json({ success: false, message: "Failed to delete post" }, { status: 500 });
  }
}
