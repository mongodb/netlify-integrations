import { afterEach, beforeEach, expect, test } from "vitest";
import { cleanupDummyRepo, initDummyRepo } from "./utils/repo";

function sum(a: number, b: number) {
  return a + b;
}

beforeEach(async () => {
  console.log("before each");
  try {
    await initDummyRepo();
  } catch (e) {
    console.log(e);
  }
});

afterEach(async () => {
  await cleanupDummyRepo();
});
test("Package lock hash is the same when no dependencies are installed", async () => {});
