"use client";

import { IDKitWidget, ISuccessResult, VerificationLevel } from "@worldcoin/idkit";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function GateScreen() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (result: ISuccessResult) => {
    const res = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        proof: result.proof,
        merkle_root: result.merkle_root,
        nullifier_hash: result.nullifier_hash,
        verification_level: result.verification_level,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Verification failed");
    }
  };

  const onSuccess = () => {
    router.refresh();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-3xl font-bold mb-4">Daily Proof</h1>
      <p className="text-gray-600 mb-8 max-w-md">
        Verify with World ID (Orb Required) to enter Daily Proof.
      </p>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <IDKitWidget
        app_id={process.env.NEXT_PUBLIC_WORLD_APP_ID as `app_${string}`}
        action="enter"
        verification_level={VerificationLevel.Orb}
        handleVerify={handleVerify}
        onSuccess={onSuccess}
        onError={() => setError("Verification failed")}
      >
        {({ open }: { open: () => void }) => (
          <button
            onClick={open}
            className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Verify to Enter
          </button>
        )}
      </IDKitWidget>
    </div>
  );
}
