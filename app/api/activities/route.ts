import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, duration, partnerId, satisfaction, emotions, note, partnerName } = body;

    console.log("Received data:", body);

    // 先获取或创建默认用户
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: "default@example.com",
        },
      });
    }

    // 如果有 partnerName，创建或查找 Partner
    let createdPartnerId = undefined;
    if (partnerName) {
      const existingPartner = await prisma.partner.findFirst({
        where: {
          userId: user.id,
          nickname: partnerName,
        },
      });
      if (existingPartner) {
        createdPartnerId = existingPartner.id;
      } else {
        const newPartner = await prisma.partner.create({
          data: {
            userId: user.id,
            nickname: partnerName,
          },
        });
        createdPartnerId = newPartner.id;
      }
    }

    const activity = await prisma.activity.create({
      data: {
        userId: user.id,
        activityMode: partnerName ? "partner" : "solo",
        partnerId: createdPartnerId,
        activityDate: new Date(date),
        durationMinutes: duration,
        satisfactionScore: satisfaction,
        emotionTags: JSON.stringify(emotions),
        encryptedNote: note,
      },
    });

    console.log("Created activity:", activity);

    return NextResponse.json({
      success: true,
      message: "记录保存成功",
      data: activity,
    });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { success: false, message: `保存失败: ${error instanceof Error ? error.message : "未知错误"}` },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const activities = await prisma.activity.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        partner: true,
      },
      orderBy: {
        activityDate: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { success: false, message: `查询失败: ${error instanceof Error ? error.message : "未知错误"}` },
      { status: 500 }
    );
  }
}
