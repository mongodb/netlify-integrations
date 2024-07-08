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
    this.tree = doc.ast;
    console.log("called doc");
    //find metadata
    [this.robots, this.keywords, this.description] = this.findMetadata();
    this.paragraphs = this.findParagraphs();
    //find paragraphs
    //find code
    //find title, headings
    //find slug
    //find preview
    //find facets
  }

  findMetadata() {
    console.log("Finding metadata");
    let robots: Boolean = true;
    //keywords is supposed to be an array of arrays of strings??
    let keywords: string[] | null = null;
    let description: string[] | null = null;

    let results = JSONPath({
      path: "$..children[?(@.type=='heading')].children",
      json: this.tree,
    });
    console.log("results:", results);
    console.log("value:", results[0]);
    // if (results) {
    //   const val = results[0].value;
    //   //check if robots, set to false if no robots
    //   if ("robots" in val && (val.robots == "None" || val.robots == "noindex"))
    //     robots = false;

    //   if (val.includes("keywords")) {
    //     keywords = val.keywords;
    //   }
    //   if (val.includes("description")) {
    //     keywords = val.description;
    //   }
    //   return [robots, keywords, description];
    // }

    return [];
  }

  findParagraphs() {
    console.log("Finding paragraphs");
  }
}
