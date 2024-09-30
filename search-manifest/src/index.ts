// Documentation: https://sdk.netlify.com
import { NetlifyIntegration } from "@netlify/sdk";
import { Manifest } from "./generateManifest/manifest";
import { promisify } from "node:util";
import { BSON } from "bson";
import { Document } from "./generateManifest/document";
import { uploadManifest } from "./uploadToAtlas/uploadManifest";

import { readdir, readFileSync } from "node:fs";
import getProperties from "./uploadToAtlas/getProperties";
import { uploadManifestToS3 } from "./uploadToS3/uploadManifest";
import { closeSearchDb, closeSnootyDb } from "./uploadToAtlas/searchConnector";
import type { s3UploadParams } from "./types";

const readdirAsync = promisify(readdir);

const integration = new NetlifyIntegration();

export const generateManifest = async () => {
  const manifest = new Manifest();
  console.log("=========== generating manifests ================");

  // Get list of file entries in documents dir
  const entries = await readdirAsync("documents", { recursive: true });
  const mappedEntries = entries.filter((fileName) => {
    return (
      fileName.includes(".bson") &&
      !fileName.includes("images") &&
      !fileName.includes("includes") &&
      !fileName.includes("sharedinclude")
    );
  });

  for (const entry of mappedEntries) {
    // Read and decode each entry
    const decoded = BSON.deserialize(readFileSync(`documents/${entry}`));

    // Parse data into a document and format it as a Manifest document
    const processedDoc = new Document(decoded).exportAsManifestDocument();
    if (processedDoc) manifest.addDocument(processedDoc);
  }
  return manifest;
};

//Return indexing data from a page's AST for search purposes.
integration.addBuildEventHandler(
  "onSuccess",
  async ({ utils: { run }, netlifyConfig }) => {
    // Get content repo zipfile as AST representation

    await run.command("unzip -o bundle.zip");
    const branch = netlifyConfig.build?.environment.BRANCH;

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

    console.log("=========== Uploading Manifests to S3=================");
    const uploadParams: s3UploadParams = {
      bucket: "docs-search-indexes-test",
      //TODO: change this values based on environments
      prefix: "search-indexes/ab-testing",
      fileName: `${projectName}-${branch}.json`,
      manifest: manifest.export(),
    };

    const s3Status = await uploadManifestToS3(uploadParams);

    console.log(`S3 upload status: ${JSON.stringify(s3Status)}`);
    console.log("=========== Finished Uploading to S3  ================");

    try {
      manifest.url = url;
      manifest.global = includeInGlobalSearch;

      console.log("=========== Uploading Manifests to Atlas =================");
      const status = await uploadManifest(manifest, searchProperty);
      console.log(status);
      console.log("=========== Manifests uploaded to Atlas =================");
    } catch (e) {
      console.log("Manifest could not be uploaded", e);
    } finally {
      await closeSearchDb();
      await closeSnootyDb();
    }
  }
);

export { integration };
