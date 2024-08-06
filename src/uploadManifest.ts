import {
  TransactionOptions,
  ClientSession,
  AnyBulkWriteOperation,
  Collection,
} from "mongodb";
import crypto from "crypto";
import { Manifest } from "./manifest";
import { db } from "./connector";
import assert from "assert";
import { ManifestEntry } from "./manifestEntry";

export interface RefreshInfo {
  deleted: number;
  updated: string[];
  skipped: string[];
  errors: Error[];
  dateStarted: Date;
  dateFinished: Date | null;
  elapsedMS: number | null;
}

//should extend manifestentry instead
interface DatabaseDocument extends ManifestEntry {
  url: string;
  manifestRevisionId: string;
  searchProperty: string[];
  includeInGlobalSearch: boolean;
}

function generateHash(data: string): Promise<string> {
  const hash = crypto.createHash("sha256");

  return new Promise((resolve, reject) => {
    hash.on("readable", () => {
      const data = hash.read();
      if (data) {
        resolve(data.toString("hex"));
      }
    });

    hash.write(data);
    hash.end();
  });
}

export function joinUrl(base: string, path: string): string {
  return base.replace(/\/*$/, "/") + path.replace(/^\/*/, "");
}

const composeUpserts = async (
  manifest: Manifest,
  searchProperty: string,
  lastModified: Date,
  hash: string
) => {
  const documents = manifest.documents;
  return documents.map((document) => {
    assert.strictEqual(typeof document.slug, "string");
    // DOP-3545 and DOP-3585
    // slug is possible to be empty string ''
    assert.ok(document.slug || document.slug === "");

    // DOP-3962
    // We need a slug field with no special chars for keyword search
    // and exact match, e.g. no "( ) { } [ ] ^ “ ~ * ? : \ /" present
    document.strippedSlug = document.slug.replaceAll("/", "");

    //don't need to sort facets first??
    // if (document.facets) {
    //   document.facets = sortFacetsObject(document.facets, trieFacets);
    // }

    const newDocument: DatabaseDocument = {
      ...document,
      url: joinUrl(manifest.url, document.slug),
      manifestRevisionId: hash,
      searchProperty: [searchProperty],
      includeInGlobalSearch: manifest.global,
    };

    return {
      updateOne: {
        filter: {
          searchProperty: newDocument.searchProperty,
          slug: newDocument.slug,
        },
        update: { $set: newDocument },
        upsert: true,
      },
    };
  });
};

const deleteStaleDocuments = async (
  collection: Collection<DatabaseDocument>,
  session: ClientSession,
  status: RefreshInfo,
  searchProperty: string,
  manifestRevisionId: string
) => {
  console.debug(`Removing old documents`);
  const deleteResult = await collection.deleteMany(
    {
      searchProperty: searchProperty,
      manifestRevisionId: { $ne: manifestRevisionId },
    },
    { session }
  );
  status.deleted +=
    deleteResult.deletedCount === undefined ? 0 : deleteResult.deletedCount;
  console.debug(
    `Removed ${deleteResult.deletedCount} entries from ${collection.collectionName}`
  );
};
const executeUpload = async (
  upserts: AnyBulkWriteOperation<DatabaseDocument>[]
) => {
  //start a session
  const dbSession = await db();
  const documents = dbSession.collection<DatabaseDocument>("documents");
  const startTime = process.hrtime.bigint();

  //define transaction options
  //TO DO: why these options??
  const transactionOptions: TransactionOptions = {
    readPreference: "primary",
    readConcern: { level: "local" },
    writeConcern: { w: "majority" },
  };

  documents.bulkWrite(upserts);
  //withTransaction
  //compose upserts

  //delete stale documents
  //TODO: how do we want to delete stale properties?

  //end session
};

export const uploadManifest = async (manifest: Manifest) => {
  const startTime = process.hrtime.bigint();
  const status: RefreshInfo = {
    deleted: 0,
    updated: [],
    skipped: [],
    errors: [],
    dateStarted: new Date(),
    dateFinished: null,
    elapsedMS: null,
  };
  //get URL, pathname from url

  // get manifests, analogous to getManifestFromDirectory
  //need searchProperty, data, a hash, lastModified

  const hash = await generateHash(manifest.toString());
  const lastModified = new Date();
  let manifestMeta = {
    searchProperty: "",
    lastModified: lastModified,
    manifestRevisionId: hash,
    manifest: manifest,
  };

  const upserts = await composeUpserts(
    manifest,
    "searchProperty",
    lastModified,
    hash
  );
  executeUpload(upserts);
  //   await deleteStaleDocuments(manifest.documents, dbSession, status);
  //   await deleteStaleDocuments(unindexable, dbSession, status);

  //make sure url of manifest doesn't have excess leading slashes(as done in getManifests)

  //check property types
  console.info(`Starting transaction: ${manifestMeta.searchProperty}`);
  assert.strictEqual(typeof manifestMeta.searchProperty, "string");
  assert.ok(manifestMeta.searchProperty);
  assert.strictEqual(typeof manifestMeta.manifestRevisionId, "string");
  assert.ok(manifestMeta.manifestRevisionId);
};
