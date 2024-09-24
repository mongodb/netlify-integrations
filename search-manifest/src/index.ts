// Documentation: https://sdk.netlify.com
import { NetlifyIntegration } from "@netlify/sdk";
import { Manifest } from "./generateManifest/manifest";
import { promisify } from "util";
import { BSON } from "bson";
import { Document } from "./generateManifest/document";
import { uploadManifest } from "./uploadToAtlas/uploadManifest";

import { readdir, readFileSync } from "fs";
import getProperties from "./uploadToAtlas/getProperties";
import { uploadManifestToS3 } from "./uploadToS3/uploadManifest";
import { teardown } from "./uploadToAtlas/searchConnector";

const readdirAsync = promisify(readdir);

const integration = new NetlifyIntegration();

export const generateManifest = async () => {
  // create Manifest object
  const manifest = new Manifest();
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

  process.chdir("documents");
  for (const entry of mappedEntries) {
    //each file is read and decoded
    const decoded = BSON.deserialize(readFileSync(`${entry}`));
    //put file into Document object
    //export Document object
    const processedDoc = new Document(decoded).exportAsManifestDocument();
    //add document to manifest object if it was able to be indexed
    if (processedDoc) manifest.addDocument(processedDoc);
  }
  return manifest;
};

//Return indexing data from a page's AST for search purposes.
integration.addBuildEventHandler(
  "onSuccess",
  async ({ utils: { run }, netlifyConfig }) => {
    // Get content repo zipfile in AST representation.

    await run.command("unzip -o bundle.zip");
    const branch = netlifyConfig.build?.environment["BRANCH"];

    //use export function for uploading to S3
    const manifest = await generateManifest();

    console.log("=========== finished generating manifests ================");
    const {
      searchProperty,
      projectName,
      url,
      includeInGlobalSearch,
    }: {
      searchProperty: string;
      projectName: string;
      url: string;
      includeInGlobalSearch: boolean;
    } = await getProperties(branch);

    //uploads manifests to S3
    console.log("=========== Uploading Manifests to S3=================");
    //upload manifests to S3
    const uploadParams = {
      bucket: "docs-search-indexes-test",
      //TODO: change this values based on environments
      prefix: "search-indexes/ab-testing",
      fileName: `${projectName}-${branch}.json`,
      manifest: manifest.export(),
    };

    const s3Status = await uploadManifestToS3({ ...uploadParams });

    console.log(`S3 upload status: ${JSON.stringify(s3Status)}`);
    console.log("=========== Finished Uploading to S3  ================");

    try {
      manifest.url = url;
      manifest.global = includeInGlobalSearch;

      //uploads manifests to atlas
      console.log("=========== Uploading Manifests =================");
      await uploadManifest(manifest, searchProperty);
      console.log("=========== Manifests uploaded to Atlas =================");
    } catch (e) {
      console.log("Manifest could not be uploaded", e);
    } finally {
      teardown();
    }
  }
);

export { integration };
