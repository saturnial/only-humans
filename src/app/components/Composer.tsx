"use client";

import { IDKitRequestWidget, orbLegacy } from "@worldcoin/idkit";
import type { IDKitResult, IDKitErrorCodes, RpContext } from "@worldcoin/idkit";
import { useState, useCallback } from "react";
import { StatusResponse } from "@/types";

interface ComposerProps {
  status: StatusResponse;
  onPostSuccess: () => void;
}

export default function Composer({ status, onPostSuccess }: ComposerProps) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [rpContext, setRpContext] = useState<RpContext | null>(null);

  const action = `daily-post:${status.dayUtc}`;

  const fetchRpContext = useCallback(async () => {
    try {
      const res = await fetch("/api/rp-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      setRpContext(data.rp_context);
      return data.rp_context;
    } catch {
      setError("Failed to initialize verification");
      return null;
    }
  }, [action]);

  if (!status.canPostToday) {
    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 text-center">
        <p className="text-gray-600">
          You already posted today (UTC). Come back tomorrow.
        </p>
      </div>
    );
  }

  const handleOpen = async () => {
    setError(null);
    const ctx = rpContext || (await fetchRpContext());
    if (ctx) {
      setWidgetOpen(true);
    }
  };

  const handleSuccess = async (result: IDKitResult) => {
    setPosting(true);
    setError(null);

    try {
      const res = await fetch("/api/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          proof_result: result,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to post");
      } else {
        setContent("");
        onPostSuccess();
      }
    } catch {
      setError("Failed to post");
    } finally {
      setPosting(false);
    }
  };

  const handleError = (errorCode: IDKitErrorCodes) => {
    setError(`Verification failed: ${errorCode}`);
    setRpContext(null);
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
        <button
          onClick={handleOpen}
          disabled={!canSubmit || posting}
          className="bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {posting ? "Posting..." : "Verify & Post"}
        </button>
      </div>
      {rpContext && (
        <IDKitRequestWidget
          app_id={process.env.NEXT_PUBLIC_WORLD_APP_ID as `app_${string}`}
          action={action}
          rp_context={rpContext}
          allow_legacy_proofs={true}
          preset={orbLegacy()}
          open={widgetOpen}
          onOpenChange={(open) => {
            setWidgetOpen(open);
            if (!open) setRpContext(null);
          }}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      )}
    </div>
  );
}
