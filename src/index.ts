// Documentation: https://sdk.netlify.com
import { NetlifyIntegration } from "@netlify/sdk";
import { execFile } from "child_process";

import { promisify } from "util";

const execFileAsync = promisify(execFile);
const integration = new NetlifyIntegration();

integration.addBuildEventHandler("onSuccess", async ({ utils: { cache } }) => {
  console.log("Creating cache files...");
  await execFileAsync("./snooty-parser/snooty/snooty", ["create-cache", "."]);
  console.log("Cache files created");
});

export { integration };
