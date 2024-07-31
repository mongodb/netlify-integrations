import { describe, expect, test, it, vi } from "vitest";
import { generateManifest } from "../../src";
import { BSON } from "bson";
import { promisify } from "util";

import nodeManifest from "../resources/s3Manifests/node-current.json";

// import { fs } from "memfs";
import * as fs from "fs";
import { Manifest } from "../../src/manifest";
const readdirAsync = promisify(fs.readdir);
// module.exports = fs;

// vi.mock("node:fs");
// vi.mock("node:fs/promises");

//start process and run command to open zip file in documents folder
describe("Generate manifests from ast", () => {
  let manifest: Manifest;
  it("can generate the manifest", async () => {
    //open zip into other folder
    // fs.writeFileSync(path, "../resources/docs_node_ast");
    // console.log(process.cwd());
    process.chdir("./documents");
    manifest = await generateManifest();
  });
  it("can read file", () => {
    process.chdir("../../tests/resources/s3Manifests");
    expect(manifest.documents).toHaveLength(nodeManifest.documents.length);
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
