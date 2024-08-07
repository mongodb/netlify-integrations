import { ManifestEntry } from "./manifestEntry";

export interface RefreshInfo {
  deleted: number;
  updated: number;
  inserted: number;
  skipped: string[];
  errors: Error[];
  dateStarted: Date;
  dateFinished: Date | null;
  elapsedMS: number | null;
}

//should extend manifestentry instead
export interface DatabaseDocument extends ManifestEntry {
  url: string;
  manifestRevisionId: string;
  searchProperty: string[];
  includeInGlobalSearch: boolean;
}
