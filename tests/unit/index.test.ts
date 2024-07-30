import { describe, expect, test, it, vi } from "vitest";
import { generateManifest } from "../../src";
// import { fs } from "memfs";
import * as fs from "fs";
import { run } from "node:test";
// module.exports = fs;

// vi.mock("node:fs");
// vi.mock("node:fs/promises");

//mock file system with a specific file
const path = "./documents";
describe("Generate manifests from ast", () => {
  // fs.mkdir("./documents", (err) => {
  //   console.log(err);
  // });
  it("should return the proper manifest", async () => {
    //open zip into other folder
    // fs.writeFileSync(path, "../resources/docs_node_ast");
    // console.log(process.cwd());
    const manifest = await generateManifest(path);
    console.log(manifest);
  });
  it("can read file", () => {
    // const entries = fs.readdirSync("./documents", { recursive: true });
    // console.log(entries);
  });

  //test exportAsManifest
});

//test Document creation
describe("given a decoded document generate all of the correct properties", () => {
  //declare decoded documents here
  it("should return the proper metadata", () => {});

  it("should return the proper paragraphs", () => {});
  it("should return the proper headings and titles", () => {});
  it("should return the proper slug", () => {});
  it("should return the proper preview", () => {});
  it("should return the proper facets", () => {});
  it("should correctly return whether the document is indexable", () => {});
});

//check export manifest function
