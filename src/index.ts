// Documentation: https://sdk.netlify.com
import { NetlifyIntegration } from "@netlify/sdk";
import { promisify } from "util";
import { readdir } from "fs";

const readdirAsync = promisify(readdir);

const integration = new NetlifyIntegration();

interface Manifest {
  url?: URL;
  includeInGlobalSearch: boolean;
  documents: ManifestEntry[];
}

interface ManifestEntry {
  slug: string;
  title?: string[];
  headings?: string[][];
  paragraphs: string;
  code: {};
  preview?: string;
  tags: string[];
  facets: any;
}

const generateManifest = async (
  filePath: string,
  includeInGlobalSearch: boolean,
  run?: any
) => {
  console.log("Running generating manifest function");

  //unzip ziplfile
  console.log("unzipping zipfile");
  // run.command("unzip bundle.zip");
  console.log("Bundle unzipped");

  //go into documents directory and get list of file entries
  process.chdir("documents");
  const entries = await readdirAsync(process.cwd());

  console.log("before entries", entries, "after entries");

  //create Manifest object
  const manifest: Manifest = {
    includeInGlobalSearch: includeInGlobalSearch,
    documents: [] as ManifestEntry[],
  };

  //iterate over entries and add each eligible entry to Manifest object
  for (const entry in entries) {
    console.log("entries");
    if (entry.includes("documents")) {
      console.log("found a document");
    }
  }
  return manifest;
};

integration.addBuildEventHandler("onSuccess", async ({ utils: { run } }) => {
  // Get content repo zipfile in AST representation.
  const filePath =
    (await readdirAsync(process.cwd())).filter((filePath) =>
      filePath.match("bundle.zip")
    )[0] ?? "";

  console.log("unzipping zipfile");
  run.command("unzip bundle.zip");
  console.log("Bundle unzipped");

  //go into documents directory and get list of file entries
  // process.chdir("documents");
  // const entries = await readdirAsync(process.cwd());

  // for (const entry in entries) {
  //   console.log("entries");
  //   if (entry.includes("documents")) {
  //     console.log("found a document");
  //   }
  // }

  // generateManifest(filePath, true, run);
  console.log("outside of generate manifest");
});

export { integration };
