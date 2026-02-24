"use client";

import { useState } from "react";
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
  const [status, setStatus] = useState<StatusResponse>(initialStatus);
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts);

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
      <div>
        <h1 className="text-2xl font-bold mb-4">Daily Proof</h1>
        <Composer status={status} onPostSuccess={refresh} />
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-4">Feed</h2>
        <Feed posts={posts} />
      </div>
    </div>
  );
}
