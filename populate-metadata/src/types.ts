import type { Document } from 'mongodb';

type EnvironmentConfig = {
  dev?: string;
  stg: string;
  dotcomstg: string;
  dotcomprd: string;
  prd: string;
};

export interface BranchEntry {
  name?: string;
  gitBranchName: string;
  urlSlug: string;
  isStableBranch: boolean;
  active: boolean;
}

export interface DocsetsDocument extends Document {
  project: string;
  url: EnvironmentConfig;
  prefix: EnvironmentConfig;
}

export interface ReposBranchesDocument {
  repoName: string;
  project: string;
  search?: {
    categoryTitle: string;
    categoryName?: string;
  };
  branches: Array<BranchEntry>;
  prodDeployable: boolean;
  internalOnly: boolean;
}

export type EnvVars = {
  ATLAS_CLUSTER0_URI: string;
  SNOOTY_DB_NAME: string;
  ATLAS_SEARCH_URI: string;
  SEARCH_DB_NAME: string;
  REPOS_BRANCHES_COLLECTION: string;
  DOCSETS_COLLECTION: string;
  DOCUMENTS_COLLECTION: string;
};
