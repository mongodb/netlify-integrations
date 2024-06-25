// Documentation: https://sdk.netlify.com
import { NetlifyIntegration } from "@netlify/sdk";
import { readdir } from "fs";

import { promisify } from "util";

const readdirAsync = promisify(readdir);

const integration = new NetlifyIntegration();

integration.addBuildEventHandler("onSuccess", async () => {
  const filesPaths = await readdirAsync(process.cwd());
  console.log("Hello there.");
  console.log(filesPaths);
});

export { integration };
