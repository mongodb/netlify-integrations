import { describe, expect, test, vi } from "vitest";
import { uploadManifest } from "../../src/uploadToAtlas/uploadManifest";
import { Manifest } from "../../src/generateManifest/manifest";
import nodeManifest from "../resources/s3Manifests/node-current.json";
import { beforeEach, afterEach } from "node:test";
import { db } from "../../src/uploadToAtlas/searchConnector";
import { mockDb } from "../utils/mockDB";

const BRANCH_NAME = "dummyBranch";
//define env vars
const REPO_NAME = "dummyName";
// process.env.REPO_NAME = "dummyName";

//teardown connections
beforeEach(async () => {
  vi.mock("../src/uploadToAtlas/searchConnector", async () => {
    const { mockDb, teardownMockDbClient } = await import("../utils/mockDB");

    return {
      teardown: teardownMockDbClient,
      db: async () => {
        const db = await mockDb();
        return db;
      },
    };
  });
});

afterEach(async () => {
  //delete all documents in repo

  //teardown db instance
  const { teardownMockDbClient } = await import("../utils/mockDB");

  await teardownMockDbClient();
});

//given empty manifest, test that it doesn't run
// describe("Upload manifest doesn't work for invalid manifests", () => {
//   let manifest: any;
//   test("throws an error for an empty manifest", async () => {
//     expect(
//       async () => await uploadManifest(manifest, BRANCH_NAME)
//     ).rejects.toThrowError();
//   });

//   test("throws an error for a manifest with 0 documents", async () => {
//     manifest = new Manifest(true);
//     expect(
//       async () => await uploadManifest(manifest, BRANCH_NAME)
//     ).rejects.toThrowError();
//   });
// });

// given manifests, test that it uploads said manifests
describe("Upload manifest uploads to Atlas db", () => {
  let manifest: Manifest = new Manifest(
    nodeManifest.includeInGlobalSearch,
    nodeManifest.url
  );
  manifest.documents = nodeManifest.documents;

  test("nodeManifest properly uploads", async () => {
    //find a way to check that there are no documents in the collection yet
    const status = await uploadManifest(manifest, BRANCH_NAME);
    console.log(status);

    const db = await mockDb();
    const documents = db.collection("documents");
    //count number of documents in collection
  });

  //test another db

  //test nodeManifest+ another db at once, additive
});

//test that it updates documents with same search properties
//upload manifest1
//upload manifest 2 - check number of fields updated

// describe("Upload manifest uploads to Atlas db and updates existing manifests correctly ", () => {
//   let manifest1: Manifest = new Manifest(
//     nodeManifest.includeInGlobalSearch,
//     nodeManifest.url
//   );
//   manifest1.documents = nodeManifest.documents;

//   let manifest2: Manifest = new Manifest(
//     nodeManifest.includeInGlobalSearch,
//     nodeManifest.url
//   );
//   manifest2.documents = nodeManifest.documents;

//   test("nodeManifest properly uploads", async () => {
//     //find a way to check that there are no documents in the collection yet
//     let status = await uploadManifest(manifest1, BRANCH_NAME);
//     console.log(status);
//     expect(uploadManifest(manifest1, BRANCH_NAME)).resolves;

//     const db = await mockDb();
//     const documents = db.collection("documents");
//     //count number of documents in collection

//     status = await uploadManifest(manifest2, BRANCH_NAME);
//   });

//   //test another db

//   //test nodeManifest+ another db at once, additive
// });

// //test composeUpserts
