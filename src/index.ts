// Documentation: https://sdk.netlify.com
import { NetlifyIntegration } from "@netlify/sdk";
import { readdir } from "fs";

import { promisify } from "util";

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

const generate_manifest = (filePath: any) => {
  console.log("generating manifest function");
  const manifest: Manifest = {
    includeInGlobalSearch: true,
    documents: [] as ManifestEntry[],
  };
  return manifest;
};
integration.addBuildEventHandler("onSuccess", async () => {
  const filePath = (await readdirAsync(process.cwd())).filter((filePath) =>
    filePath.match("bundle.zip")
  );

  console.log("Hello, logging bundle.zip.");
  console.log(filePath[0]);
  const manifest = generate_manifest(filePath);
  console.log(manifest);
});

export { integration };
