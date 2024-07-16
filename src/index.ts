// Documentation: https://sdk.netlify.com
import { NetlifyIntegration } from "@netlify/sdk";
import { Manifest } from "./manifest";
import { promisify } from "util";
import { BSON } from "bson";
import { Document } from "./document";
import { readdir, readFileSync } from "fs";

const readdirAsync = promisify(readdir);

const integration = new NetlifyIntegration();
const ZIP_PATH = ``;

export const generateManifest = async () => {
  // create Manifest object
  const manifest = new Manifest(true);

  //go into documents directory and get list of file entries
  const entries = await readdirAsync("documents", { recursive: true });
  const mappedEntries = entries.filter((fileName) => {
    fileName.includes(".bson") &&
      !fileName.includes("images") &&
      !fileName.includes("includes") &&
      !fileName.includes("sharedinclude");
  });

  console.log(JSON.stringify(mappedEntries));
  //need a check here
  for (const entry of mappedEntries) {
    console.log(entry);
    //each file is read and decoded
    const decoded = BSON.deserialize(readFileSync(`documents/${entry}`));
    //put file into Document object
    //export Document object
    const processedDoc = new Document(decoded).exportAsManifest();
    //add document to manifest object
    manifest.addDocument(processedDoc);
  }
  return manifest;
};

//Return indexing data from a page's AST for search purposes.
integration.addBuildEventHandler("onSuccess", async ({ utils: { run } }) => {
  // Get content repo zipfile in AST representation.
  // console.log("unzipping zipfile");
  await run.command("unzip -o bundle.zip");
  // console.log("Bundle unzipped");

  generateManifest();

  console.log("outside of generate manifest");
});

export { integration };
