"use client";

import { FeedPost } from "@/types";

interface FeedProps {
  posts: FeedPost[];
}

export default function Feed({ posts }: FeedProps) {
  if (posts.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8">
        No posts yet. Be the first to post today!
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => {
        const date = new Date(post.createdAt);
        const timeUtc = date.toISOString().slice(11, 16) + " UTC";

        return (
          <div key={post.id} className="border border-gray-200 rounded-lg p-4">
            <p className="text-gray-900 whitespace-pre-wrap break-words">
              {post.content}
            </p>
            <div className="mt-2 text-sm text-gray-500">
              <span>{post.dayUtc}</span>
              <span className="mx-2">&middot;</span>
              <span>{timeUtc}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
