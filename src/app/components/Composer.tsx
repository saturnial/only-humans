"use client";

import { IDKitWidget, ISuccessResult, VerificationLevel } from "@worldcoin/idkit";
import { useState } from "react";
import { StatusResponse } from "@/types";

interface ComposerProps {
  status: StatusResponse;
  onPostSuccess: () => void;
}

export default function Composer({ status, onPostSuccess }: ComposerProps) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  if (!status.canPostToday) {
    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 text-center">
        <p className="text-gray-600">
          You already posted today (UTC). Come back tomorrow.
        </p>
      </div>
    );
  }

  const handleVerify = async (result: ISuccessResult) => {
    setPosting(true);
    setError(null);

    try {
      const res = await fetch("/api/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          proof: result.proof,
          merkle_root: result.merkle_root,
          nullifier_hash: result.nullifier_hash,
          verification_level: result.verification_level,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to post");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post");
      throw err;
    } finally {
      setPosting(false);
    }
  };

  const onSuccess = () => {
    setContent("");
    onPostSuccess();
  };

  const trimmedLength = content.trim().length;
  const canSubmit = trimmedLength >= 1 && trimmedLength <= 200;

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind today?"
        className="w-full resize-none border-0 focus:ring-0 focus:outline-none text-gray-900 placeholder-gray-400 bg-transparent"
        rows={3}
        maxLength={200}
      />
      <div className="flex items-center justify-between mt-2">
        <span
          className={`text-sm ${trimmedLength > 200 ? "text-red-500" : "text-gray-400"}`}
        >
          {trimmedLength}/200
        </span>
        {error && <span className="text-sm text-red-500">{error}</span>}
        <IDKitWidget
          app_id={process.env.NEXT_PUBLIC_WORLD_APP_ID as `app_${string}`}
          action={`daily-post:${status.dayUtc}`}
          verification_level={VerificationLevel.Orb}
          handleVerify={handleVerify}
          onSuccess={onSuccess}
          onError={() => setError("Verification failed")}
        >
          {({ open }: { open: () => void }) => (
            <button
              onClick={open}
              disabled={!canSubmit || posting}
              className="bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {posting ? "Posting..." : "Verify & Post"}
            </button>
          )}
        </IDKitWidget>
      </div>
    </div>
  );
}
