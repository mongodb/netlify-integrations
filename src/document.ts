import { NetlifyIntegration } from "@netlify/sdk";
import * as jp from "jsonpath";

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

    let results = jp.query(
      this.tree,
      "$..children[?(@.type=='heading')].children"
    );
    if (results) {
      results = results[0].value;
      //check if robots, set to false if no robots
      if (
        (results.includes("robots") && results["robots"] == "None") ||
        results["robots"].includes("noindex")
      ) {
        robots = false;
      }
      if (results.includes("keywords")) {
        keywords = results["keywords"];
      }
      if (results.includes("description")) {
        keywords = results["description"];
      }
      return [robots, keywords, description];
    }

    return [];
  }
}
