// Documentation: https://sdk.netlify.com
import { NetlifyIntegration } from "@netlify/sdk";
import { promisify } from "util";
import { readdir, readdirSync, readFileSync, writeFile } from "fs";
import { BSON, EJSON, ObjectId } from "bson";
import { Document } from "./document";
import { Manifest } from "./manifest";

const readdirAsync = promisify(readdir);

const integration = new NetlifyIntegration();

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

const processManifest = (decodedFile: any) => {
  //put file into Document object
  //export Document object
  const doc = new Document(decodedFile).exportAsManifest();
  return doc;
};

//Return indexing data from a page's AST for search purposes.
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
      try {
        console.log(entry);
        //the file is read and decoded
        const decoded = BSON.deserialize(readFileSync(entry));
        // proccess snooty manifest
        const processedDoc = processManifest(decoded);
        //add document to manifest object
        manifest.addDocument(processedDoc);
      } catch (e) {
        console.log(`error found: ${e}`);
      }
    }
  }

  console.log(readdirSync(process.cwd()));
  // generateManifest(filePath, true, run);
  console.log("outside of generate manifest");
});

export { integration };
