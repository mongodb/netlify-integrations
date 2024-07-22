import { beforeEach, describe, it } from "vitest";
import { GITHUB_USER, Page, updatePages } from "../src/update-pages";

const COLLECTION_NAME = "updated_documents";

beforeEach(() => {});
describe("Update Pages Unit Tests", () => {
  it("", async () => {
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
