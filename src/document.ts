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
    //find slug
    //find preview
    //find facets
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
    console.log("results:", results);
    // console.log("value:", results[0][0].value);
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
    let paragraphs = "";

    let results = JSONPath({
      path: "$..children[?(@.type=='paragraph')]..value",
      json: this.tree,
    });

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

    let codeContents = [];
    for (let r of results) {
      const lang = r.value.get("lang", null);
      codeContents.push({ lang: lang, value: r.value["value"] });
    }

    return codeContents;
  }
}
