import { afterEach, beforeEach, describe, it, vi } from "vitest";
import { GITHUB_USER, Page, updatePages } from "../src/update-pages";
// import { getMockDb } from "./utils/mockDb";
const COLLECTION_NAME = "updated_documents";

beforeEach(() => {
  vi.mock("../src/connector", async () => {
    const { getMockDb } = await import("./utils/mockDb");

    const db = await getMockDb();

    return {
      db: async () => db,
    };
  });
});

afterEach(async () => {
  const { teardownMockDbClient } = await import("./utils/mockDb");

  await teardownMockDbClient();
});

describe("Update Pages Unit Tests", async () => {
  it("updates pages runs successfully", async () => {
    const testPages: Page[] = [
      {
        page_id: "page0.txt",
        filename: "page0.txt",
        github_username: GITHUB_USER,
        source: "",
        ast: {
          type: "root",
          fileid: "page0.txt",
          options: {},
          children: [],
          foo: "foo",
          bar: { foo: "foo" },
          position: {
            start: {
              line: {
                $numberInt: "0",
              },
            },
          },
        },
        static_assets: [],
      },
    ];

    await updatePages(testPages, COLLECTION_NAME);
  });
});
