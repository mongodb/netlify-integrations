<<<<<<< HEAD
import type { BSON } from 'bson';
import { JSONPath } from 'jsonpath-plus';
import type { ManifestEntry, ManifestFacets, Metadata } from '../types';
import { type Facet, createFacet } from './createFacets';
=======
import { JSONPath } from 'jsonpath-plus';
import { createFacet, type Facet } from './createFacets';
import type { BSON } from 'bson';
import type { ManifestFacets, Metadata, ManifestEntry } from '../types';
>>>>>>> main

export class Document {
  //Return indexing data from a page's JSON-formatted AST for search purposes

  tree: BSON.Document;
  robots: boolean;
  keywords: string | null;
  description?: string;
  paragraphs: string;
  code: Array<{ lang: string; value: string }>;
  title: string;
  headings: Array<string>;
  slug: string;
  preview: string | null;
  facets: ManifestFacets;
  noIndex: boolean;
  reasons: Array<string>;

  constructor(doc: BSON.Document) {
    this.tree = doc;

    //find metadata
    const { robots, keywords, description } = this.findMetadata();

    this.robots = robots;
    this.keywords = keywords;
    this.description = description;
    //find paragraphs
    this.paragraphs = this.findParagraphs();

    //find code
    this.code = this.findCode();

    //find title, headings
    const { title, headings } = this.findHeadings();
    this.title = title;
    this.headings = headings;

    //derive slug
    this.slug = this.deriveSlug();

    //derive preview
    this.preview = this.derivePreview();

    //derive facets
    this.facets = deriveFacets(this.tree);

    //noindex, reasons
    const { noIndex, reasons } = this.getNoIndex();
    this.noIndex = noIndex;
    this.reasons = reasons;
  }

  findMetadata = (): Metadata => {
    let robots = true; //can be set in the rst if the page is supposed to be crawled
    let keywords: string | null = null; //keywords is an optional list of strings
    let description: string | undefined; //this can be optional??

    const results = JSONPath({
      path: "$..children[?(@.name=='meta')]..options",
      json: this.tree,
    });
    if (results.length) {
      if (results.length > 1)
        console.log(
          `length of results is greater than one, length =  ${results.length}`,
        );
      const val = results[0];
      //check if robots, set to false if no robots
      if ('robots' in val && (val.robots === 'None' || val.robots === 'noindex'))
        robots = false;

      keywords = val?.keywords;
      description = val?.description;
    }

    return { robots, keywords, description };
  };

  findParagraphs() {
    let paragraphs = '';

    const results = JSONPath({
      path: "$..children[?(@.type=='paragraph')]..value",
      json: this.tree,
    });

    for (const r of results) {
      paragraphs += ` ${r}`;
    }
    return paragraphs.trim();
  }

  findCode() {
    const results = JSONPath({
      path: "$..children[?(@.type=='code')]",
      json: this.tree,
    });

    const codeContents = [];
    for (const r of results) {
      // when will there be no value for language?? do we want to set to null if that happens??
      const lang = r.lang ?? null;
      codeContents.push({ lang: lang, value: r.value });
    }
    return codeContents;
  }

  findHeadings() {
    const headings: Array<string> = [];
    let title = '';
    // Get the children of headings nodes

    const results = JSONPath({
      path: "$..children[?(@.type=='heading')].children",
      json: this.tree,
    });

    //no heading nodes found?? page doesn't have title, or headings
    if (!results.length) return { title, headings };

    for (const r of results) {
      const heading = [];
      const parts = JSONPath({
        path: '$..value',
        json: r,
      });

      //add a check in case there is no parts found
      for (const part of parts) {
        // add a check in case there is no value field found
        heading.push(part);
      }
      headings.push(heading.join());
    }

    title = headings.shift() ?? '';
    return { title, headings };
  }

  deriveSlug() {
    let pageId = this.tree.filename?.split('.')[0];
    if (pageId === 'index') pageId = '';
    return pageId;
  }

  derivePreview() {
    //set preview to the meta description if one is specified

    if (this.description) return this.description;

    // Set preview to the paragraph value that's a child of a 'target' element
    // (for reference pages that lead with a target definition)

    let results = JSONPath({
      path: "$..children[?(@.type=='target')].children[?(@.type=='paragraph')]",
      json: this.tree,
    });

    if (!results.length) {
      //  Otherwise attempt to set preview to the first content paragraph on the page,
      //   excluding admonitions.
      results = JSONPath({
        path: "$..children[?(@.type=='section')].children[?(@.type=='paragraph')]",
        json: this.tree,
      });
    }

    if (results.length) {
      const strList = [];

      //get value in results
      const first = JSONPath({
        path: '$..value',
        json: results[0],
      });

      for (const f of first) {
        strList.push(f);
      }
      return strList.join('');
    }

    //else, give up and don't provide a preview
    return null;
  }

  getNoIndex() {
    //determining indexability

    let noIndex = false;
    const reasons: string[] = [];

    //if :robots: None in metadata, do not index
    if (!this.robots) {
      noIndex = true;
      reasons.push('robots=None or robots=noindex in meta directive');
    }

    //if page has no title, do not index
    if (!this.title) {
      noIndex = true;
      reasons.push('This page has no headings');
    }

    return { noIndex, reasons };
  }

  exportAsManifestEntry = (): ManifestEntry | '' => {
    // Generate a manifest entry from a document

    if (this.noIndex) {
      console.info('Refusing to index');
      return '';
    }

    const manifestEntry = {
      slug: this.slug,
      title: this.title,
      headings: this.headings,
      paragraphs: this.paragraphs,
      code: this.code,
      preview: this.preview,
      tags: this.keywords,
      facets: this.facets,
    };

    return manifestEntry;
  };
}

const deriveFacets = (tree: BSON.Document) => {
  //Format facets for ManifestEntry from bson entry tree['facets'] if it exists

  const insertKeyVals = (facet: Facet, prefix = '') => {
    const key = prefix + facet.category;
    documentFacets[key] = documentFacets[key] ?? [];
    documentFacets[key].push(facet.value);

    if (!facet.subFacets) return;

    for (const subFacet of facet.subFacets) {
      insertKeyVals(subFacet, `${key}>${facet.value}>`);
    }
  };

  const documentFacets: Record<string, Array<string>> = {};
  if (tree.facets) {
    for (const facetEntry of tree.facets) {
      const facet = createFacet({
        category: facetEntry.category,
        value: facetEntry.value,
        subFacets: [],
      });
      insertKeyVals(facet);
    }
    return documentFacets;
  }
  return null;
};
