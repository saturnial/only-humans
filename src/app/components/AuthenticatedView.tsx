"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusResponse, FeedPost } from "@/types";
import Composer from "./Composer";
import Feed from "./Feed";

interface AuthenticatedViewProps {
  initialStatus: StatusResponse;
  initialPosts: FeedPost[];
}

export default function AuthenticatedView({
  initialStatus,
  initialPosts,
}: AuthenticatedViewProps) {
  const router = useRouter();
  const [status, setStatus] = useState<StatusResponse>(initialStatus);
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
  };

  const refresh = async () => {
    const [statusRes, feedRes] = await Promise.all([
      fetch("/api/me/status"),
      fetch("/api/feed"),
    ]);

    if (statusRes.ok) {
      setStatus(await statusRes.json());
    }
    if (feedRes.ok) {
      setPosts(await feedRes.json());
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Daily Proof</h1>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Log out
        </button>
      </div>
      <div>
        <Composer status={status} onPostSuccess={refresh} />
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-4">Feed</h2>
        <Feed posts={posts} />
      </div>
    </div>
  );
}
