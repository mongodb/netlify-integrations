// Documentation: https://sdk.netlify.com
import { NetlifyIntegration } from "@netlify/sdk";
import axios from "axios";
import { existsSync, readdir } from "fs";

import { promisify } from "util";

const readdirAsync = promisify(readdir);

const getCacheFilePaths = (filesPaths: string[]): string[] =>
  filesPaths.filter((filePath) => filePath.endsWith(".cache.gz"));

const integration = new NetlifyIntegration();

interface GitHubCommitResponse {
  commit: {
    sha: string;
  };
}

async function getLatestSnootyCommit(): Promise<string | undefined> {
  try {
    const response = await axios.get<GitHubCommitResponse>(
      "https://api.github.com/repos/mongodb/snooty/branches/netlify-poc",
      {
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );

    const latestSha = response.data.commit.sha;

    return latestSha;
  } catch (e) {
    console.error("Could not retrieve latest SHA", e);
  }
}

integration.addBuildEventHandler(
  "onPreBuild",
  async ({ utils: { cache, run } }) => {
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

    console.log("Checking Snooty frontend version");
    const snootyDirExists = existsSync(`${process.cwd()}/snooty`);

    if (snootyDirExists) {
      const latestSha = await getLatestSnootyCommit();

      const { stdout: currentSha } = await run.command("git rev-parse HEAD");

      if (currentSha !== latestSha) {
        await run.command("rm -rf snooty");
      }
    }
  }
);

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
    const { all, stderr, stdout } = await run.command(
      "./snooty-parser/snooty/snooty create-cache .",
      { all: true }
    );

    const logs = all ?? stdout + stderr;

    const logsSplit =
      logs
        .split("\n")
        .filter(
          (row) =>
            !row.includes("INFO:snooty.gizaparser.domain") &&
            !row.includes("INFO:snooty.parser:cache")
        ) || [];

    let errorCount = 0;
    let warningCount = 0;

    logsSplit.forEach((row) => {
      if (row.includes("ERROR")) errorCount += 1;
      if (row.includes("WARNING")) warningCount += 1;
    });

    status.show({
      title: `Snooty Parser Logs - Errors: ${errorCount} | Warnings: ${warningCount}`,
      summary: logsSplit.join("\n"),
    });
  }
);

export { integration };
