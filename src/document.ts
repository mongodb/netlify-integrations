import { NetlifyIntegration } from "@netlify/sdk";
import { JSONPath } from "jsonpath-plus";

export class Document {
  //Return indexing data from a page's JSON-formatted AST for search purposes
  tree: any;
  robots: any;
  keywords: any;
  description: any;
  paragraphs: any;
  code: any;
  title: any;
  headings: any;
  slug: any;
  preview: any;
  facets: any;
  noIndex: any;
  reasons: any;

  constructor(doc: any) {
    this.tree = doc;
    // this.tree.ast = JSON.stringify(this.tree.ast);
    console.log("called doc");
    //find metadata
    [this.robots, this.keywords, this.description] = this.findMetadata();
    //find paragraphs
    this.paragraphs = this.findParagraphs();
    //find code
    this.code = this.findCode();

    //find title, headings
    [this.title, this.headings] = this.findHeadings();

    //derive slug
    this.slug = this.deriveSlug();

    //derive preview
    this.preview = this.derivePreview();

    //derive facets
    this.facets = this.deriveFacets();

    //noindex, reasons
  }

  findMetadata() {
    console.log("Finding metadata");
    let robots: Boolean = true; //can be set in the rst if the page is supposed to be crawled
    let keywords: string[] | null = null; //keywords is an optional list of strings
    let description: string | null = null; //this can be optional??

    let results = JSONPath({
      path: "$..children[?(@.name=='meta')]..options",
      json: this.tree,
    });
    // console.log("\n\r metadata results:", results);
    if (results.length) {
      if (results.length > 1)
        console.log(
          "length of results is greater than one, it's: " + results.length
        );
      const val = results[0];
      //check if robots, set to false if no robots
      if ("robots" in val && (val.robots == "None" || val.robots == "noindex"))
        robots = false;

      keywords = val.keywords ?? null;
      description = val.description ?? null;
      console.log(
        `robots: ${robots}, keywords: ${keywords}, description: ${description}`
      );
      return [robots, keywords, description];
    }

    return [];
  }

  findParagraphs() {
    console.log("Finding paragraphs");
    let paragraphs = "";

    let results = JSONPath({
      path: "$..children[?(@.type=='paragraph')]..value",
      json: this.tree,
    });

    console.log("\n\r paragraph results:", results);
    for (let r of results) {
      paragraphs += r;
    }
    return paragraphs;
  }

  findCode() {
    console.log("finding code");

    let results = JSONPath({
      path: "$..children[?(@.type=='code')]",
      json: this.tree,
    });

    console.log("\n\r code results:", results);

    let codeContents = [];
    for (let r of results) {
      const lang = r.lang ?? null;
      codeContents.push({ lang: lang, value: r.value });
    }
    console.log(`codeContents: ${codeContents}`);
    return codeContents;
  }

  findHeadings() {
    console.log("Finding headings and title");
    let headings: string[] = [];
    let title: string | undefined | null = null;
    // Get all headings nodes

    let results = JSONPath({
      path: "$..children[?(@.type=='heading')].children",
      json: this.tree,
    });

    // console.log(`\n\r headings results: ${results.length}, ${results}`);

    //no heading nodes found?? page doesn't have title, or headings
    if (!results.length) return [title, headings];

    for (let r of results) {
      let heading = [];
      const parts = JSONPath({
        path: "$..value",
        json: r.value,
      });
      console.log(
        `\n\r parts results for heading: ${JSON.stringify(r)}, value: ${
          r.value
        }`
      );
      //add a check in case there is no value field found

      // for (let part of parts) {
      //   // add a check in case there is no value field found
      //   heading.push(part.value);
      // }
      // headings.push(heading.join());
    }

    title = headings.shift();
    return [title, headings];
  }

  deriveSlug() {
    console.log("Deriving slug");

    let page_id = this.tree["filename"].split(".")[0];
    if (page_id == "index") page_id = "";
    return page_id;
  }

  derivePreview() {
    console.log("Deriving document search preview");
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
      let str_list = [];

      //get value in results
      const first = JSONPath({
        path: "$..value",
        json: results[0],
      });

      for (let f of first) {
        str_list.push(f.value);
      }
      return str_list.join();
    }

    //else, give up and don't provide a preview
    return;
  }

  deriveFacets() {
    return;
  }
}
