// Documentation: https://sdk.netlify.com
import { NetlifyIntegration } from "@netlify/sdk";
import { Manifest } from "./manifest";
import { generateManifest } from "./manifest";

const integration = new NetlifyIntegration();
const ZIP_PATH = ``;

//Return indexing data from a page's AST for search purposes.
integration.addBuildEventHandler("onSuccess", async ({ utils: { run } }) => {
  // Get content repo zipfile in AST representation.
  // console.log("unzipping zipfile");
  await run.command("unzip bundle.zip");
  // console.log("Bundle unzipped");

  generateManifest();

  console.log("outside of generate manifest");
});

export { integration };
