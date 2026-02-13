import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { reason, description } = await request.json();
    if (!reason) {
      return NextResponse.json({ success: false, message: "Reason required" }, { status: 400 });
    }

    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({ data: { email: "default@example.com" } });
    }

    await prisma.report.create({
      data: {
        reporterId: user.id,
        postId: params.id,
        reason,
        description: description || null,
      },
    });

    return NextResponse.json({ success: true, message: "Report submitted" });
  } catch (error) {
    console.error("Report Error:", error);
    return NextResponse.json({ success: false, message: "Failed to submit report" }, { status: 500 });
  }
}
