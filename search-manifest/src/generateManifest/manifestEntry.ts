import type { Facet } from './createFacets';

export interface ManifestEntry {
  slug: string;
  strippedSlug?: string;
  title: string;
  headings?: string[];
  paragraphs: string;
  code: { lang: string | null; value: string }[];
  preview?: string | null;
  tags: string | null;
  facets: Facet;


}
