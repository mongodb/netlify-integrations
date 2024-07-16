// Documentation: https://sdk.netlify.com
import { NetlifyIntegration } from "@netlify/sdk";
import { promisify } from "util";
import { readdir, readdirSync, readFileSync } from "fs";
import { BSON } from "bson";
import { Document } from "./document";
import { Manifest } from "./manifest";

const readdirAsync = promisify(readdir);

const integration = new NetlifyIntegration();

//Return indexing data from a page's AST for search purposes.
integration.addBuildEventHandler("onSuccess", async ({ utils: { run } }) => {
  // Get content repo zipfile in AST representation.
  const filePath =
    (await readdirAsync(process.cwd())).filter((filePath) =>
      filePath.match("bundle.zip")
    )[0] ?? "";

  // console.log("unzipping zipfile");
  await run.command("unzip bundle.zip");
  // console.log("Bundle unzipped");

  // create Manifest object
  const manifest = new Manifest(true);

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
      console.log(entry);
      //the file is read and decoded
      const decoded = BSON.deserialize(readFileSync(entry));
      // console.log(decoded.ast);

      //put file into Document object
      //export Document object
      const processedDoc = new Document(decoded).exportAsManifest();
      //add document to manifest object
      manifest.addDocument(processedDoc);
    }
  }

  // generateManifest(filePath, true, run);
  console.log("outside of generate manifest");
});

export { integration };
