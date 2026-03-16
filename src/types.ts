export type AssetType = 'character' | 'scene' | 'prop';

export interface Candidate {
  id: string;
  url: string;
  name: string;
  originalUrl?: string; // URL of the uncompressed original image
}

export interface CommunicationMessage {
  id: string;
  text: string;
  colorClass: string;
  isStrikethrough: boolean;
}

export interface StateFinalizedAsset {
  id: string;
  url: string;
  originalUrl?: string;
  name: string;
  stateLabel: string;
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
  communications?: CommunicationMessage[];
  stateFinalizedAssets?: StateFinalizedAsset[];
}

export interface Project {
  id: string;
  scriptText: string;
  assets: Asset[];
  announcement?: string; // New field for announcement board
  usageNotice?: string; // New field for usage notice
  clearPassword?: string; // Password for clearing the project
}
