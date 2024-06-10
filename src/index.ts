// Documentation: https://sdk.netlify.com
import { NetlifyIntegration } from "@netlify/sdk";
import { readdir } from "fs";

import { promisify } from "util";

const readdirAsync = promisify(readdir);

async function getCacheFilePaths(): Promise<string[]> {
  const filesPaths = await readdirAsync(process.cwd());

  const cacheFilePaths = filesPaths.filter((filePath) =>
    filePath.endsWith(".cache.gz")
  );
  return cacheFilePaths;
}
const integration = new NetlifyIntegration();

integration.addBuildEventHandler(
  "onSuccess",
  async ({ utils: { run, cache } }) => {
    console.log("Creating cache files...");
    await run.command("./snooty-parser/snooty/snooty create-cache .");
    console.log("Cache files created");

    const cacheFiles = await getCacheFilePaths();

    await Promise.all(
      cacheFiles.map(async (filePath) => {
        console.log(`Adding cache file: ${filePath}`);
        await cache.save(filePath);
      })
    );
  }
);

export { integration };
