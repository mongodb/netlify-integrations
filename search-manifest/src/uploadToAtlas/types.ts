import { WithId } from "mongodb";
import { ManifestEntry } from "../generateManifest/manifestEntry";

export interface RefreshInfo {
  deleted: number;
  upserted: number;
  modified: number;
  dateStarted: Date;
  elapsedMS: number;
}

interface EnvironmentConfig {
  dev: string;
  stg: string;
  dotcomstg: string;
  dotcomprd: string;
  prd: string;
}

export interface DocsetsDocument extends WithId<Document> {
  url: EnvironmentConfig;
  prefix: EnvironmentConfig;
}

export interface DatabaseDocument extends ManifestEntry {
  url: string;
  lastModified: Date;
  manifestRevisionId: string;
  searchProperty: string[];
  includeInGlobalSearch: boolean;
}

export interface ReposBranchesDocument extends WithId<Document> {
  project: string;
  search: {
    categoryTitle: string;
    categoryName?: string;
  };
  branches: Array<BranchEntry>;
  prodDeployable: boolean;
  internalOnly: boolean;
}

export interface BranchEntry {
  name?: string;
  gitBranchName: string;
  urlSlug: string;
  isStableBranch: boolean;
  active: boolean;
}
