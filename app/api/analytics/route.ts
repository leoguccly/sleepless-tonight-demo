import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const range = request.nextUrl.searchParams.get("range") || "month";

    const user = await prisma.user.findFirst();
    if (!user) {
      return NextResponse.json({ success: true, data: { entries: [], emotions: {}, summary: { total: 0, avg: 0, maxStreak: 0 } } });
    }

    const now = new Date();
    let startDate: Date;

    if (range === "week") {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
    } else if (range === "year") {
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
    } else {
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
    }

    const activities = await prisma.activity.findMany({
      where: {
        userId: user.id,
        deletedAt: null,
        activityDate: { gte: startDate },
      },
      include: { partner: true },
      orderBy: { activityDate: "asc" },
    });

    // Build daily entries for chart
    const entries = activities.map((a) => ({
      date: a.activityDate.toISOString().split("T")[0],
      score: a.satisfactionScore,
      duration: a.durationMinutes,
      mode: a.activityMode,
      partner: a.partner?.nickname || null,
    }));

    // Emotion distribution
    const emotionMap: Record<string, number> = {};
    activities.forEach((a) => {
      const tags: string[] = JSON.parse(a.emotionTags || "[]");
      tags.forEach((tag) => {
        emotionMap[tag] = (emotionMap[tag] || 0) + 1;
      });
    });

    // Mode distribution
    const modeCount = { partner: 0, solo: 0 };
    activities.forEach((a) => {
      if (a.activityMode === "partner") modeCount.partner++;
      else modeCount.solo++;
    });

    // Summary
    const total = activities.length;
    const avg = total > 0
      ? Math.round((activities.reduce((s, a) => s + a.satisfactionScore, 0) / total) * 10) / 10
      : 0;

    // Streak calculation
    let maxStreak = 0;
    let currentStreak = 0;
    const dateSet = new Set(activities.map((a) => a.activityDate.toISOString().split("T")[0]));
    const sortedDates = [...dateSet].sort();
    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        currentStreak = 1;
      } else {
        const prev = new Date(sortedDates[i - 1]);
        const curr = new Date(sortedDates[i]);
        const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
        currentStreak = diffDays === 1 ? currentStreak + 1 : 1;
      }
      maxStreak = Math.max(maxStreak, currentStreak);
    }

    return NextResponse.json({
      success: true,
      data: {
        entries,
        emotions: emotionMap,
        modeCount,
        summary: { total, avg, maxStreak },
      },
    });
  } catch (error) {
    console.error("Analytics Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
