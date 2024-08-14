import { describe, expect, test, it, vi, beforeAll } from "vitest";
import {
  uploadManifest,
  getProperties,
} from "../../src/uploadToAtlas/uploadManifest";
import { Manifest } from "../../src/generateManifest/manifest";
import nodeManifest from "../resources/s3Manifests/node-current.json";
import { beforeEach } from "node:test";

const BRANCH_NAME = "dummyBranch";
//define env vars
const REPO_NAME = "dummyName";
// process.env.REPO_NAME = "dummyName";

//teardown connections
beforeEach();

//given empty manifest, test that it doesn't run
describe("Upload manifest doesn't work for invalid manifests", () => {
  let manifest: any;
  test("throws an error for an empty manifest", async () => {
    expect(
      async () => await uploadManifest(manifest, BRANCH_NAME)
    ).rejects.toThrowError();
  });
  test("throws an error for a manifest with 0 documents", async () => {
    manifest = new Manifest(true);
    expect(
      async () => await uploadManifest(manifest, BRANCH_NAME)
    ).rejects.toThrowError();
  });
});

// given manifests, test that it uploads said manifests
describe("Upload manifest uploads to Atlas db", () => {
  let manifest: Manifest = new Manifest(
    nodeManifest.includeInGlobalSearch,
    nodeManifest.url
  );
  manifest.documents = nodeManifest.documents;

  test("nodeManifest properly uploads", async () => {
    vi.stubEnv("REPO_NAME", "dummyName");
    expect(process.env.REPO_NAME === "REPO_NAME");
    console.log(await uploadManifest(manifest, BRANCH_NAME));
    expect(uploadManifest(manifest, BRANCH_NAME)).resolves;
  });
});

//test that it updates documents with same search properties
//upload manifest1
//upload manifest 2 - check number of fields updated

//test composeUpserts

//test getProperties
