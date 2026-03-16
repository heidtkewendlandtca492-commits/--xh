export type AssetType = 'character' | 'scene' | 'prop';

export interface Candidate {
  id: string;
  url: string;
  name: string;
  originalUrl?: string; // URL of the uncompressed original image
}

export interface Asset {
  id: string;
  type: AssetType;
  name: string;
  episodes: string;
  description: string;
  originalText: string;
  candidates: Candidate[];
  finalizedId?: string;
  referenceImage?: Candidate; // Kept for backwards compatibility
  referenceImages?: Candidate[]; // New field for multiple images
  audioReference?: Candidate;
  actorCandidates?: Candidate[];
}

export interface Project {
  id: string;
  scriptText: string;
  assets: Asset[];
  announcement?: string; // New field for announcement board
}
