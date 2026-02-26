"use client";

import { IDKitRequestWidget, orbLegacy } from "@worldcoin/idkit";
import type { IDKitResult, IDKitErrorCodes, RpContext } from "@worldcoin/idkit";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";

export default function GateScreen() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [rpContext, setRpContext] = useState<RpContext | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchRpContext = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/rp-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "enter" }),
      });
      const data = await res.json();
      setRpContext(data.rp_context);
      return data.rp_context;
    } catch {
      setError("Failed to initialize verification");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleOpen = async () => {
    setError(null);
    const ctx = rpContext || (await fetchRpContext());
    if (ctx) {
      setWidgetOpen(true);
    }
  };

  const handleSuccess = async (result: IDKitResult) => {
    const res = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Verification failed");
    } else {
      router.refresh();
    }
  };

  const handleError = (errorCode: IDKitErrorCodes) => {
    setError(`Verification failed: ${errorCode}`);
    // Refresh rp_context for next attempt since nonce is single-use
    setRpContext(null);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-3xl font-bold mb-4">Daily Proof</h1>
      <p className="text-gray-600 mb-8 max-w-md">
        Verify with World ID (Orb Required) to enter Daily Proof.
      </p>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <button
        onClick={handleOpen}
        disabled={loading}
        className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        {loading ? "Loading..." : "Verify to Enter"}
      </button>
      {rpContext && (
        <IDKitRequestWidget
          app_id={process.env.NEXT_PUBLIC_WORLD_APP_ID as `app_${string}`}
          action="enter"
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
