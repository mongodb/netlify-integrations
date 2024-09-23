//change this to an interface
export class ManifestEntry {
  slug: string;
  strippedSlug?: string;
  title: string;
  headings?: string[];
  paragraphs: string;
  code: { lang: string | null; value: string }[];
  preview?: string | null;
  tags: string | null;
  //TODO: add type
  facets: any;

  // TODO: add type for entry
  constructor(entry: any) {
    this.slug = entry.slug;
    this.title = entry.title;
    this.headings = entry.headings;
    this.paragraphs = entry.paragraphs;
    this.code = entry.code;
    this.preview = entry.preview;
    this.tags = entry.keywords;
    this.facets = entry.facets;
  }
}
