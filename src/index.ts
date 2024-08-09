// Documentation: https://sdk.netlify.com
import { NetlifyIntegration } from "@netlify/sdk";
import { Manifest } from "./manifest";
import { promisify } from "util";
import { BSON } from "bson";
import { Document } from "./document";
import { uploadManifest } from "./uploadManifest";

import { readdir, readFileSync } from "fs";
import { DeployContext } from "@netlify/sdk/client";

const readdirAsync = promisify(readdir);

const integration = new NetlifyIntegration();
const ZIP_PATH = ``;

export const generateManifest = async () => {
  // create Manifest object
  const manifest = new Manifest(true);
  console.log("=========== generating manifests ================");
  //go into documents directory and get list of file entries

  const entries = await readdirAsync("documents", { recursive: true });

  const mappedEntries = entries.filter((fileName) => {
    return (
      fileName.includes(".bson") &&
      !fileName.includes("images") &&
      !fileName.includes("includes") &&
      !fileName.includes("sharedinclude")
    );
  });

  // console.log("entries:" + JSON.stringify(mappedEntries), mappedEntries.length);
  //need a check here
  process.chdir("documents");
  for (const entry of mappedEntries) {
    //each file is read and decoded
    const decoded = BSON.deserialize(readFileSync(`${entry}`));
    //put file into Document object
    //export Document object
    const processedDoc = new Document(decoded).exportAsManifestDocument();
    //add document to manifest object
    manifest.addDocument(processedDoc);
  }
  return manifest;
};

//Return indexing data from a page's AST for search purposes.
integration.addBuildEventHandler(
  "onSuccess",
  async ({ utils: { run }, netlifyConfig }) => {
    // Get content repo zipfile in AST representation.

    let repoName = await run.command(
      "basename $(git remote get-url origin) .git"
    );
    // repoName = repoName.split("/").pop();
    console.log("repoName:", repoName);
    await run.command("unzip -o bundle.zip");
    const branch = netlifyConfig.build?.environment["BRANCH"];

    //this export function is likely not needed
    const manifest = await generateManifest();

    console.log("=========== finished generating manifests ================");
    await uploadManifest(manifest);
    console.log("=========== Uploading Manifests to Atlas ================");
  }
);

export { integration };
