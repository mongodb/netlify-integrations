import {
  afterAll,
  beforeEach,
  afterEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";
import { uploadManifest } from "../../src/uploadToAtlas/uploadManifest";
import { Manifest } from "../../src/generateManifest/manifest";
import nodeManifest from "../resources/s3Manifests/node-current.json";
import { mockDb } from "../utils/mockDB";
import { DatabaseDocument } from "../../src/uploadToAtlas/types";
import { getManifest } from "../utils/getManifest";

const PROPERTY_NAME = "dummyName";

//teardown connections
beforeEach(async () => {
  vi.mock("../../src/uploadToAtlas/searchConnector", async () => {
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

const checkCollection = async () => {
  const db = await mockDb();
  const documentCount = await db
    .collection<DatabaseDocument>("documents")
    .estimatedDocumentCount();
  expect(documentCount).toEqual(0);
};

const removeDocuments = async () => {
  //delete all documents in repo
  const db = await mockDb();
  await db.collection<DatabaseDocument>("documents").deleteMany({});
  const documentCount = await db
    .collection<DatabaseDocument>("documents")
    .estimatedDocumentCount();
};

afterAll(async () => {
  //teardown db instance
  const { teardownMockDbClient } = await import("../utils/mockDB");
  await teardownMockDbClient();
});

// given empty manifest, test that it doesn't run
describe("Upload manifest doesn't work for invalid manifests", () => {
  let manifest: Manifest;

  test("throws an error for an empty manifest", async () => {
    expect(
      async () => await uploadManifest(manifest, PROPERTY_NAME)
    ).rejects.toThrowError();
  });

  test("throws an error for a manifest with 0 documents", async () => {
    manifest = new Manifest("", true);
    expect(
      async () => await uploadManifest(manifest, PROPERTY_NAME)
    ).rejects.toThrowError();
  });
});

// given manifests, test that it uploads said manifests
describe("Upload manifest uploads to Atlas db", () => {
  beforeEach(async () => {
    await checkCollection();
  });
  afterEach(async () => {
    await removeDocuments();
  });
  let manifest: Manifest;

  test("constant nodeManifest uploads correct number of documents", async () => {
    manifest = new Manifest(
      nodeManifest.url,
      nodeManifest.includeInGlobalSearch
    );
    console.log;
    manifest.documents = nodeManifest.documents;

    await uploadManifest(manifest, PROPERTY_NAME);

    //check that manifests have been uploaded
    const db = await mockDb();
    const documents = db.collection<DatabaseDocument>("documents");
    console.log(db);
    //count number of documents in collection
    expect(await documents.countDocuments()).toEqual(manifest.documents.length);
  });

  test("Generated node manifest uploads correct number of documents", async () => {
    //get new manifest
    manifest = await getManifest("node");

    //  upload manifest
    const status = await uploadManifest(manifest, PROPERTY_NAME);
    expect(status.upserted).toEqual(manifest.documents.length);

    //check that manifests have been uploaded
    const db = await mockDb();
    const documents = db.collection<DatabaseDocument>("documents");
    expect(await documents.countDocuments()).toEqual(manifest.documents.length);
  });
});

describe("Upload manifest uploads to Atlas db and updates existing manifests correctly ", async () => {
  let manifest1: Manifest = new Manifest(
    nodeManifest.url,
    nodeManifest.includeInGlobalSearch
  );
  manifest1.documents = nodeManifest.documents;
  const db = await mockDb();
  const documents = db.collection("documents");
  const kotlinManifest = await getManifest("kotlin");

  test("nodeManifest uploads all documents", async () => {
    await checkCollection();
    const status1 = await uploadManifest(manifest1, PROPERTY_NAME);
    expect(status1.upserted).toEqual(manifest1.documents.length);
    //reopen connection to count current num of documents in collection
    await mockDb();

    expect(await documents.countDocuments()).toEqual(
      manifest1.documents.length
    );

    //re upload the same manifest
    const status2 = await uploadManifest(manifest1, PROPERTY_NAME);
    expect(status2.upserted).toEqual(0);
  });

  test("two separate manifests uplodaded uploads correct number of entries", async () => {
    //find a way to check that there are no documents in the collection yet
    await mockDb();
    expect(await documents.countDocuments()).toEqual(
      manifest1.documents.length
    );
    const status = await uploadManifest(kotlinManifest, "docs-kotlin");
    expect(status.upserted).toEqual(kotlinManifest.documents.length);

    //reopen connection to count current num of documents in collection
    await mockDb();
    expect(await documents.countDocuments()).toEqual(
      kotlinManifest.documents.length + manifest1.documents.length
    );

    //re upload the same manifest
    const status2 = await uploadManifest(manifest1, PROPERTY_NAME);
    expect(status2.upserted).toEqual(0);
  });
});
