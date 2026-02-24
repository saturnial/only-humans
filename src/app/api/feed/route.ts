import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/session";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      content: true,
      dayUtc: true,
      createdAt: true,
      // Omit userId for anonymity
    },
  });

  return NextResponse.json(posts);
}
