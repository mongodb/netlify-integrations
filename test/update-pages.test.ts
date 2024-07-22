import { afterEach, beforeEach, describe, it, vi } from "vitest";
import { GITHUB_USER, Page, updatePages } from "../src/update-pages";

const COLLECTION_NAME = "updated_documents";

beforeEach(() => {
  vi.mock("../src/connector", async () => {
    const { getMockDb, teardownMockDbClient } = await import("./utils/mockDb");

    return {
      teardown: teardownMockDbClient,
      db: async () => {
        const db = await getMockDb();
        return db;
      },
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
