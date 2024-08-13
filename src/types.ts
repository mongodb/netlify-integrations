import { ManifestEntry } from "./manifestEntry";

export interface RefreshInfo {
  deleted: number;
  upserted: number;
  errors: boolean;
  dateStarted: Date;
  dateFinished: Date | null;
  elapsedMS: number | null;
}

//should extend manifestentry instead
export interface DatabaseDocument extends ManifestEntry {
  url: string;
  lastModified: Date;
  manifestRevisionId: string;
  searchProperty: string[];
  includeInGlobalSearch: boolean;
}
