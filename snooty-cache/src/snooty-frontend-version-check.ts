import { NetlifyPluginUtils } from "@netlify/build";
import axios from "axios";
import { createHash } from "crypto";
import { existsSync } from "fs";

import { readFile } from "fs";
import { promisify } from "util";

const readFileAsync = promisify(readFile);

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

async function getPackageLockHash(): Promise<string> {
  const packageLock = await readFileAsync(
    `${process.cwd()}/snooty/package-lock.json`
  );

  const hashSum = createHash("sha256");
  hashSum.update(packageLock);

  return hashSum.digest("hex");
}

export async function checkForNewSnootyVersion(run: NetlifyPluginUtils["run"]) {
  console.log("Checking Snooty frontend version");
  const snootyDirExists = existsSync(`${process.cwd()}/snooty`);

  if (snootyDirExists) {
    const latestSha = await getLatestSnootyCommit();

    const { stdout: currentSha } = await run.command("git rev-parse HEAD");

    if (currentSha !== latestSha) {
      console.log(
        "Current commit does not match the latest commit. Updating the snooty frontend repo"
      );
      const prevPackageLockHash = await getPackageLockHash();
      await run.command("cd snooty && git pull");

      const updatedPackageLockHash = await getPackageLockHash();

      if (prevPackageLockHash !== updatedPackageLockHash) {
        console.log("Dependencies updating. Installing updates.");
        await run.command("cd snooty && npm ci");
        console.log("Updates for the frontend completed!");
      }
    }
  }
}
