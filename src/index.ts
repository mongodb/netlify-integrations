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

const generateManifest = async (filePath: any) => {
  console.log("generating manifest function");
  const manifest: Manifest = {
    includeInGlobalSearch: true,
    documents: [] as ManifestEntry[],
  };

  return manifest;
};

integration.addBuildEventHandler("onSuccess", async ({ utils: { run } }) => {
  console.log(await readdirAsync(process.cwd()));
  const filePath = (await readdirAsync(process.cwd())).filter((filePath) =>
    filePath.match("bundle.zip")
  );
  console.log("Hello, logging files");
  console.log(filePath[0]);

  await run.command("unzip bundle.zip");
  process.chdir("documents");
  const newFile = await readdirAsync(process.cwd());
  console.log(process.cwd);
  console.log("finished piping");
});

export { integration };
