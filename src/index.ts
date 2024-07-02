// Documentation: https://sdk.netlify.com
import { NetlifyIntegration } from "@netlify/sdk";
import { promisify } from "util";
import { readdir, readdirSync, readFileSync, open } from "fs";
import { BSON, EJSON, ObjectId } from "bson";

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

// const generateManifest = async (
//   filePath: string,
//   includeInGlobalSearch: boolean,
//   run?: any
// ) => {
// };

const processManifest = (decodedFile: any) => {
  //put file into Document object
  //export Document object
  return decodedFile;
};

integration.addBuildEventHandler("onSuccess", async ({ utils: { run } }) => {
  // Get content repo zipfile in AST representation.
  const filePath =
    (await readdirAsync(process.cwd())).filter((filePath) =>
      filePath.match("bundle.zip")
    )[0] ?? "";

  console.log("unzipping zipfile");
  await run.command("unzip bundle.zip");
  console.log("Bundle unzipped");

  //   create Manifest object
  //   const manifest: Manifest = {
  //     includeInGlobalSearch: includeInGlobalSearch,
  //     documents: [] as ManifestEntry[],
  //   };

  //go into documents directory and get list of file entries
  const entries = readdirSync("documents", { recursive: true }).map(
    (fileName) => {
      //use a joins here instead
      if (fileName.includes(".bson")) return fileName;
      else return "";
    }
  );

  process.chdir("documents");

  for (const entry of entries) {
    if (!entry.includes("images") && entry.includes("bson")) {
      console.log("found document:" + entry);

      //the file is read and decoded
      const decoded = BSON.deserialize(readFileSync(entry));
      console.log(JSON.parse(JSON.stringify(decoded)));
      //Enter proccess snooty manifest bson function
      const processedDoc = processManifest(decoded);
      //"""Return indexing data from a page's AST for search purposes."""

      //add document to manifest object
    }
  }

  // generateManifest(filePath, true, run);
  console.log("outside of generate manifest");
});

export { integration };
