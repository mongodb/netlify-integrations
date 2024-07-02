// Documentation: https://sdk.netlify.com
import { NetlifyIntegration } from "@netlify/sdk";
import { readdir } from "fs";
import { promisify } from "util";

const readdirAsync = promisify(readdir);
const integration = new NetlifyIntegration();

integration.addBuildEventHandler("onSuccess", async ({ utils: { run } }) => {
  console.log("=========== Chatbot Data Upload Integration ================");
  await run.command("unzip bundle.zip -d bundle");
  const zipPages = readdirAsync(`${process.cwd()}/bundle/documents`, {
    recursive: true,
  });

  console.log("ZipPages: ", zipPages);

  console.log("=========== Chatbot Data Upload Integration ================");
});

export { integration };
