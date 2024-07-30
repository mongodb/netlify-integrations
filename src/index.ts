// Documentation: https://sdk.netlify.com
import { NetlifyIntegration } from "@netlify/sdk";
import { Manifest } from "./manifest";
import { promisify } from "util";
import { BSON } from "bson";
import { Document } from "./document";
import { readdir, readFile, readFileSync, readdirSync, existsSync } from "fs";

const readdirAsync = promisify(readdir);
const readFileAsync = promisify(readFile);

const integration = new NetlifyIntegration();
const ZIP_PATH = ``;

export const generateManifest = async () => {
  // create Manifest object
  const manifest = new Manifest(true);
  console.log("in generate manifest");
  //go into documents directory and get list of file entries
  const asy = readdirAsync("documents");
  console.log("documents non-recursive", asy);
  const entries = await readdirAsync("documents", {
    recursive: true,
  });

  const mappedEntries = entries.filter((fileName) => {
    return (
      fileName.includes(".bson") &&
      !fileName.includes("images") &&
      !fileName.includes("includes") &&
      !fileName.includes("sharedinclude")
    );
  });

  console.log("entries:" + JSON.stringify(mappedEntries), mappedEntries.length);
  //need a check here
  process.chdir("documents");
  for (const entry of mappedEntries) {
    //each file is read and decoded
    const entries = await readdirAsync(process.cwd());

    const decoded = BSON.deserialize(readFileSync(`${entry}`));
    //put file into Document object
    //export Document object
    const processedDoc = new Document(decoded).exportAsManifestDocument();
    //add document to manifest object
    // manifest.addDocument(processedDoc);
  }
  return manifest;
};

//Return indexing data from a page's AST for search purposes.
integration.addBuildEventHandler("onSuccess", async ({ utils: { run } }) => {
  // Get content repo zipfile in AST representation.
  await run.command("unzip -o bundle.zip");

  (await generateManifest()).export();

  console.log("=========== finished generating manifests ================");
});

export { integration };
