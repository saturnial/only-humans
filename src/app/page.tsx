import { getSessionFromCookies } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getTodayUtc } from "@/lib/date";
import { FeedPost } from "@/types";
import GateScreen from "./components/GateScreen";
import AuthenticatedView from "./components/AuthenticatedView";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getSessionFromCookies();

  if (!session) {
    return <GateScreen />;
  }

  const dayUtc = getTodayUtc();

  const [existingPost, rawPosts] = await Promise.all([
    prisma.post.findUnique({
      where: {
        userId_dayUtc: { userId: session.userId, dayUtc },
      },
    }),
    prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        content: true,
        dayUtc: true,
        createdAt: true,
      },
    }),
  ]);

  const status = {
    dayUtc,
    hasPostedToday: !!existingPost,
    canPostToday: !existingPost,
  };

  const posts: FeedPost[] = rawPosts.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
  }));

  return <AuthenticatedView initialStatus={status} initialPosts={posts} />;
}
