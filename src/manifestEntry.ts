export class ManifestEntry {
  slug: string;
  title?: string[];
  headings?: string[][];
  paragraphs: string;
  code: { lang: string; value: any }[];
  preview?: string;
  tags: string[];
  facets: any;

  constructor(entry: any) {
    this.slug = entry.slug;
    this.title = entry.title;
    this.headings = entry.headings;
    this.paragraphs = entry.paragraphs;
    this.code = entry.code;
    this.preview = entry.preview;
    this.tags = entry.tags;
    this.facets = entry.facets;
  }
}
