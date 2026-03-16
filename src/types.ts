export type AssetType = 'character' | 'scene' | 'prop';

export interface Candidate {
  id: string;
  url: string;
  name: string;
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
  referenceImage?: Candidate;
  audioReference?: Candidate;
  actorCandidates?: Candidate[];
}

export interface Project {
  id: string;
  scriptText: string;
  assets: Asset[];
}
