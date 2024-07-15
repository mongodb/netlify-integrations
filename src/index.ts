// Documentation: https://sdk.netlify.com
import { NetlifyIntegration } from "@netlify/sdk";
import { promisify } from "util";
import { readdir, readdirSync, readFileSync, open } from "fs";
import { BSON, EJSON, ObjectId } from "bson";
import { Document } from "./document";

const readdirAsync = promisify(readdir);

const integration = new NetlifyIntegration();

class Manifest {
  url?: string;
  global: boolean;
  documents: ManifestEntry[];

  constructor(includeInGlobalSearch: boolean, url: string = "") {
    this.url = url;
    this.global = includeInGlobalSearch;
    this.documents = [];
  }

  addDocument(document: ManifestEntry | null) {
    //Add a document to the manifest
    if (document) this.documents.push(document);
  }

  export() {
    //return the manifest as json
    const manifest = {
      url: this.url,
      includeInGlobalSearch: this.global,
      documents: this.documents,
    };

    return JSON.stringify(manifest);
  }
}

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

// const generateManifest = async (
//   filePath: string,
//   includeInGlobalSearch: boolean,
//   run?: any
// ) => {
// };

const processManifest = (decodedFile: any) => {
  //put file into Document object
  //export Document object
  const doc = new Document(decodedFile).exportAsManifest();
  return doc;
};

integration.addBuildEventHandler("onSuccess", async ({ utils: { run } }) => {
  // Get content repo zipfile in AST representation.
  const filePath =
    (await readdirAsync(process.cwd())).filter((filePath) =>
      filePath.match("bundle.zip")
    )[0] ?? "";

  // console.log("unzipping zipfile");
  await run.command("unzip bundle.zip");
  // console.log("Bundle unzipped");

  // create Manifest object
  const manifest = new Manifest(true);

  //go into documents directory and get list of file entries
  const entries = readdirSync("documents", { recursive: true }).map(
    (fileName) => {
      //use a joins here instead
      if (fileName.includes(".bson")) return fileName;
      else return "";
    }
  );

  process.chdir("documents");

  for (const entry of entries) {
    if (!entry.includes("images") && entry.includes("bson")) {
      // console.log(entry);
      //the file is read and decoded
      const decoded = BSON.deserialize(readFileSync(entry));
      // console.log(decoded.ast);
      //Enter proccess snooty manifest bson function
      const processedDoc = processManifest(decoded);
      //"""Return indexing data from a page's AST for search purposes."""

      //add document to manifest object
      manifest.addDocument(processedDoc);
    }
  }

  // generateManifest(filePath, true, run);
  console.log("outside of generate manifest");
});

export { integration };
