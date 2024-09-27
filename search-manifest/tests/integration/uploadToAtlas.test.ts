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
import { mockDb, insert, removeDocuments } from "../utils/mockDB";
import { DatabaseDocument } from "../../src/types";
import { getManifest } from "../utils/getManifest";
import { generateHash } from "../../src/utils";

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
  afterEach(async () => {
    await removeDocuments("documents");
  });
  let manifest: Manifest;

  test("constant nodeManifest uploads correct number of documents", async () => {
    manifest = new Manifest(
      nodeManifest.url,
      nodeManifest.includeInGlobalSearch
    );
    manifest.documents = nodeManifest.documents;

    await uploadManifest(manifest, PROPERTY_NAME);

    //check that manifests have been uploaded
    const db = await mockDb();
    const documents = db.collection<DatabaseDocument>("documents");
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

describe(
  "Upload manifest uploads to Atlas db and updates existing manifests correctly ",
  async () => {
    afterEach(async () => {
      await removeDocuments("documents");
    });
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
      const status = await uploadManifest(manifest1, PROPERTY_NAME);
      await mockDb();
      expect(await documents.countDocuments()).toEqual(
        manifest1.documents.length
      );
      const status1 = await uploadManifest(kotlinManifest, "docs-kotlin");
      expect(status1.upserted).toEqual(kotlinManifest.documents.length);

      //reopen connection to count current num of documents in collection
      await mockDb();
      expect(await documents.countDocuments()).toEqual(
        kotlinManifest.documents.length + manifest1.documents.length
      );
    });

    test("stale documents from same search property are removed", async () => {
      //upload documents
      const db = await mockDb();
      const status = await uploadManifest(manifest1, PROPERTY_NAME);
      await mockDb();
      const status1 = await uploadManifest(kotlinManifest, "docs-kotlin");
      //reopen connection to count current num of documents in collection
      await mockDb();
      expect(await documents.countDocuments()).toEqual(
        kotlinManifest.documents.length + manifest1.documents.length
      );

      //insert entries with random slugs
      await mockDb();
      const dummyHash = generateHash("dummyManifest");
      const dummyDate = new Date();
      const dummyDocs = [
        {
          manifestRevisionId: dummyHash,
          lastModified: dummyDate,
          searchProperty: PROPERTY_NAME,
          slug: "dummySlug1",
        },
        {
          manifestRevisionId: dummyHash,
          lastModified: dummyDate,
          searchProperty: PROPERTY_NAME,
          slug: "dummySlug2",
        },
      ];

      insert(db, "documents", dummyDocs);
      //upload node documents again
      await mockDb();

      const status3 = await uploadManifest(manifest1, PROPERTY_NAME);
      expect(status3.deleted).toEqual(dummyDocs.length);
      expect(status3.modified).toEqual(manifest1.documents.length);
      //check all documents have current hash, time
      await mockDb();
      const empty = await db.collection<DatabaseDocument>("documents").findOne({
        searchProperty: PROPERTY_NAME,
        manifestRevisionId: dummyHash,
      });
      expect(empty).toBe(null);
    });
  },
  { timeout: 10000 }
);
