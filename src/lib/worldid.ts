interface VerifyParams {
  proof: string;
  merkle_root: string;
  nullifier_hash: string;
  action: string;
}

interface VerifyResult {
  success: boolean;
  verification_level?: string;
  nullifier_hash?: string;
}

export async function verifyWorldIDProof(
  params: VerifyParams
): Promise<VerifyResult> {
  const appId = process.env.WORLD_APP_ID;
  const apiKey = process.env.WORLD_DEV_PORTAL_API_KEY;

  if (!appId || !apiKey) {
    throw new Error("World ID environment variables not configured");
  }

  const res = await fetch(
    `https://developer.worldcoin.org/api/v2/verify/${appId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        proof: params.proof,
        merkle_root: params.merkle_root,
        nullifier_hash: params.nullifier_hash,
        action: params.action,
        verification_level: "orb",
      }),
    }
  );

  if (!res.ok) {
    const errorData = await res.text();
    console.log("World ID verify failed:", res.status, errorData);
    return { success: false };
  }

  const data = await res.json();
  return {
    success: true,
    verification_level: data.verification_level,
    nullifier_hash: data.nullifier_hash,
  };
}
