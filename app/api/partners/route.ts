import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      return NextResponse.json({ success: true, data: [] });
    }

    const partners = await prisma.partner.findMany({
      where: { userId: user.id, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });

    // Get activity stats per partner
    const partnersWithStats = await Promise.all(
      partners.map(async (p) => {
        const activities = await prisma.activity.findMany({
          where: { partnerId: p.id, deletedAt: null },
        });
        const count = activities.length;
        const avgScore = count > 0
          ? Math.round((activities.reduce((s, a) => s + a.satisfactionScore, 0) / count) * 10) / 10
          : 0;
        const lastActivity = activities.length > 0
          ? activities.sort((a, b) => b.activityDate.getTime() - a.activityDate.getTime())[0].activityDate
          : null;

        return {
          ...p,
          activityCount: count,
          avgScore,
          lastActivity,
        };
      })
    );

    return NextResponse.json({ success: true, data: partnersWithStats });
  } catch (error) {
    console.error("Partners Error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch partners" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { nickname, colorTag, notes } = await request.json();

    if (!nickname || !nickname.trim()) {
      return NextResponse.json({ success: false, message: "Nickname is required" }, { status: 400 });
    }

    // Check for common real names
    const commonNames = ["小明", "小華", "小美", "Amy", "John", "Mary", "David", "Sarah", "小王", "小李", "小張"];
    const isRealName = commonNames.some((n) => nickname.trim().toLowerCase() === n.toLowerCase());

    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({ data: { email: "default@example.com" } });
    }

    const partner = await prisma.partner.create({
      data: {
        userId: user.id,
        nickname: nickname.trim(),
        colorTag: colorTag || null,
        notes: notes || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: partner,
      warning: isRealName ? "This looks like a real name. Consider using a code name for privacy." : null,
    });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2002") {
      return NextResponse.json({ success: false, message: "A partner with this nickname already exists" }, { status: 409 });
    }
    console.error("Create Partner Error:", error);
    return NextResponse.json({ success: false, message: "Failed to create partner" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, message: "Partner ID required" }, { status: 400 });
    }

    await prisma.partner.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true, message: "Partner removed" });
  } catch (error) {
    console.error("Delete Partner Error:", error);
    return NextResponse.json({ success: false, message: "Failed to delete partner" }, { status: 500 });
  }
}
