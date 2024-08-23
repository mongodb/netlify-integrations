import { ManifestEntry } from "../generateManifest/manifestEntry";

export interface RefreshInfo {
  deleted: number;
  upserted: number;
  errors: boolean;
  dateStarted: Date;
  dateFinished: Date | null;
  elapsedMS: number | null;
}

export interface DatabaseDocument extends ManifestEntry {
  url: string;
  lastModified: Date;
  manifestRevisionId: string;
  searchProperty: string[];
  includeInGlobalSearch: boolean;
}

export interface Branch {
  branchName: string;
  active: boolean;
  urlSlug?: string | undefined;
  search: string;
  project: string;
  prodDeployable: boolean;
}
