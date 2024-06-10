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

integration.addBuildEventHandler("onPreBuild", async ({ utils: { cache } }) => {
  const files: string[] = await cache.list();

  const cacheFiles = files.filter((filePath) => filePath.endsWith(".cache.gz"));

  if (!cacheFiles.length) {
    console.log("No snooty cache files found");

    return;
  }
  // Don't want to restore duplicates, only restore snooty cache files
  console.log("restoring snooty cache files");
  await Promise.all(
    cacheFiles.map(async (cacheFile) => await cache.restore(cacheFile))
  );
});

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
