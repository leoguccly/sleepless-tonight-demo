import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      return NextResponse.json({
        success: true,
        data: { totalRecords: 0, avgSatisfaction: 0, streakDays: 0, email: "" },
      });
    }

    // Total records
    const activities = await prisma.activity.findMany({
      where: { userId: user.id, deletedAt: null },
      orderBy: { activityDate: "desc" },
    });

    const totalRecords = activities.length;
    const avgSatisfaction = totalRecords > 0
      ? Math.round(
          (activities.reduce((sum, a) => sum + a.satisfactionScore, 0) / totalRecords) * 10
        ) / 10
      : 0;

    // Calculate streak (consecutive days with records)
    let streakDays = 0;
    if (activities.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dates = new Set(
        activities.map(a => {
          const d = new Date(a.activityDate);
          d.setHours(0, 0, 0, 0);
          return d.getTime();
        })
      );

      let checkDate = new Date(today);
      // Allow today or yesterday as the start
      if (!dates.has(checkDate.getTime())) {
        checkDate.setDate(checkDate.getDate() - 1);
      }

      while (dates.has(checkDate.getTime())) {
        streakDays++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    // Partner count
    const partnerCount = await prisma.partner.count({
      where: { userId: user.id, deletedAt: null },
    });

    return NextResponse.json({
      success: true,
      data: {
        totalRecords,
        avgSatisfaction,
        streakDays,
        partnerCount,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Profile Error:", error);
    return NextResponse.json(
      { success: false, message: "获取资料失败" },
      { status: 500 }
    );
  }
}
