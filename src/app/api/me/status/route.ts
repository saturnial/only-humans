import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTodayUtc } from "@/lib/date";
import { getSessionFromRequest } from "@/lib/session";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dayUtc = getTodayUtc();

  const existingPost = await prisma.post.findUnique({
    where: {
      userId_dayUtc: {
        userId: session.userId,
        dayUtc,
      },
    },
  });

  return NextResponse.json({
    dayUtc,
    hasPostedToday: !!existingPost,
    canPostToday: !existingPost,
  });
}
