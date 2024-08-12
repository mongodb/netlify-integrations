// Documentation: https://sdk.netlify.com
import { NetlifyIntegration } from "@netlify/sdk";
import { readdir } from "fs";

import { promisify } from "util";

const readdirAsync = promisify(readdir);

const getCacheFilePaths = (filesPaths: string[]): string[] =>
  filesPaths.filter((filePath) => filePath.endsWith(".cache.gz"));

const integration = new NetlifyIntegration();

integration.addBuildEventHandler("onPreBuild", async ({ utils: { cache } }) => {
  const files: string[] = await cache.list();

  const cacheFiles = getCacheFilePaths(files);

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
    const filesPaths = await readdirAsync(process.cwd());

    const cacheFiles = getCacheFilePaths(filesPaths);

    await Promise.all(
      cacheFiles.map(async (filePath) => {
        console.log(`Adding cache file: ${filePath}`);
        await cache.save(filePath);
      })
    );
  }
);

integration.addBuildEventHandler(
  "onEnd",
  async ({ utils: { run, status } }) => {
    console.log("Creating cache files...");
    const { stdout } = await run.command(
      "./snooty-parser/snooty/snooty create-cache ."
    );

    status.show({
      title: "snooty parser logs",
      summary: "Output of the snooty parser",
      text: stdout,
    });
  }
);

export { integration };
