export interface RpContext {
  rp_id: string;
  nonce: string;
  created_at: number;
  expires_at: number;
  signature: string;
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
