import { execa } from "execa";

const TEST_REPO_NAME = "snooty";

async function command(cmd: string) {}
export async function initDummyRepo() {
  console.log("initializing dummy repo");
  await execa("mkdir", [TEST_REPO_NAME]);

  await execa("npm", ["init", "-y"], {
    cwd: `${process.cwd()}/${TEST_REPO_NAME}`,
  });
  await execa("npm", ["i"], {
    cwd: `${process.cwd()}/${TEST_REPO_NAME}`,
  });
}

export async function commitTextFile() {
  await execa("git", ["init"], { cwd: `${process.cwd()}/${TEST_REPO_NAME}` });
  await execa("touch", ["test.txt"], {
    cwd: `${process.cwd()}/${TEST_REPO_NAME}`,
  });
  await execa("git", ["add", "."], {
    cwd: `${process.cwd()}/${TEST_REPO_NAME}`,
  });
  await execa("git", ["commit", "-m", "'test commit'"], {
    cwd: `${process.cwd()}/${TEST_REPO_NAME}`,
  });
}

export async function cleanupDummyRepo() {
  await execa("rm", ["-rf", TEST_REPO_NAME]);
}
