export interface WorldIDProof {
  proof: string;
  merkle_root: string;
  nullifier_hash: string;
  verification_level: string;
}

export interface StatusResponse {
  dayUtc: string;
  hasPostedToday: boolean;
  canPostToday: boolean;
}

export interface FeedPost {
  id: string;
  content: string;
  dayUtc: string;
  createdAt: string;
}
