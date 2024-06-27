// Documentation: https://sdk.netlify.com
import { NetlifyIntegration } from "@netlify/sdk";
import { promisify } from "util";
import { readdir } from "fs";
import Zlib from "zlib";

const zlib = require("node:zlib");

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

const generateManifest = async (filePath: any) => {
  console.log("generating manifest function");
  const manifest: Manifest = {
    includeInGlobalSearch: true,
    documents: [] as ManifestEntry[],
  };
  // const astFile = await new AdmZip();
  // console.log("astFile: ", astFile);
  // astFile.getEntries().forEach((entry) => console.log("one Entry"));
  return manifest;
};

integration.addBuildEventHandler("onSuccess", async () => {
  const filePath = (await readdirAsync(process.cwd())).filter((filePath) =>
    filePath.match("bundle.zip")
  );

  console.log("Hello, logging bundle.zip.");
  console.log(filePath[0]);
  zlib.unzip(filePath[0], (er: any, buffer: any) => {
    console.log("Trying to read file");
    console.log(buffer.toString("utf8"));
  });
  // const astFile = await new AdmZip();
  // const manifest = await generateManifest(filePath);
  // console.log("manifest: ", manifest);
});

export { integration };
