// Documentation: https://sdk.netlify.com
import { NetlifyIntegration } from "@netlify/sdk";
import { readdir } from "fs";
import AdmZip from "adm-zip";
import { promisify } from "util";
import { isAsteriskToken } from "typescript";

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

const generateManifest = (filePath: any) => {
  console.log("generating manifest function");
  const manifest: Manifest = {
    includeInGlobalSearch: true,
    documents: [] as ManifestEntry[],
  };
  const astFile = new AdmZip(filePath);
  console.log("astFile: ", astFile);
  astFile.getEntries().forEach((entry) => console.log("one Entry"));
  return manifest;
};
integration.addBuildEventHandler("onSuccess", async () => {
  const filePath = (await readdirAsync(process.cwd())).filter((filePath) =>
    filePath.match("bundle.zip")
  );

  console.log("Hello, logging bundle.zip.");
  console.log(filePath[0]);
  const manifest = generateManifest(filePath);
  console.log("manifest: ", manifest);
});

export { integration };
