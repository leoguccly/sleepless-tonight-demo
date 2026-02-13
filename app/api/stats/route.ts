import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const activities = await prisma.activity.findMany({
      where: {
        deletedAt: null,
        activityDate: {
          gte: startOfMonth,
        },
      },
    });

    const totalCount = activities.length;
    const avgSatisfaction = totalCount > 0
      ? activities.reduce((sum, a) => sum + a.satisfactionScore, 0) / totalCount
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        monthlyCount: totalCount,
        avgSatisfaction: Math.round(avgSatisfaction * 10) / 10,
      },
    });
  } catch (error) {
    console.error("Stats Error:", error);
    return NextResponse.json(
      { success: false, message: "统计失败" },
      { status: 500 }
    );
  }
}
