import { Manifest } from "../generateManifest/manifest";
import { db, teardown } from "./searchConnector";
import assert from "assert";
import { RefreshInfo, DatabaseDocument } from "./types";
import { generateHash, joinUrl } from "./utils";

const ATLAS_SEARCH_URI = `mongodb+srv://${process.env.MONGO_ATLAS_USERNAME}:${process.env.MONGO_ATLAS_PASSWORD}@${process.env.MONGO_ATLAS_SEARCH_HOST}/?retryWrites=true&w=majority`;

//TODO: change these teamwide env vars in Netlify UI when ready to move to prod
const SEARCH_DB_NAME = `${process.env.MONGO_ATLAS_SEARCH_DB_NAME}`;

//TODO: make an interface/class for the uploads?

const composeUpserts = async (
  manifest: Manifest,
  searchProperty: string,
  lastModified: Date,
  hash: string
) => {
  const documents = manifest.documents;
  return documents.map((document) => {
    assert.strictEqual(typeof document.slug, "string");
    assert.ok(document.slug || document.slug === "");

    document.strippedSlug = document.slug.replaceAll("/", "");

    const newDocument: DatabaseDocument = {
      ...document,
      lastModified: lastModified,
      url: joinUrl(manifest.url, document.slug),
      manifestRevisionId: hash,
      searchProperty: [searchProperty],
      includeInGlobalSearch: manifest.global ?? false,
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

export const uploadManifest = async (
  manifest: Manifest,
  searchProperty: string
) => {
  //check that manifest documents exist
  if (!manifest?.documents?.length) {
    return Promise.reject(new Error("Invalid manifest"));
  }
  //start a session
  let documentsColl;
  try {
    const dbSession = await db(ATLAS_SEARCH_URI, SEARCH_DB_NAME);
    documentsColl = dbSession.collection<DatabaseDocument>("documents");
  } catch (e) {
    console.log("issue starting session for Search Database", e);
  }
  const status: RefreshInfo = {
    deleted: 0,
    upserted: 0,
    errors: false,
    dateStarted: new Date(),
    dateFinished: null,
    elapsedMS: null,
  };

  const hash = await generateHash(manifest.toString());
  //TODO: should we add a property for createdAt?
  const lastModified = new Date();

  const upserts = await composeUpserts(
    manifest,
    searchProperty,
    lastModified,
    hash
  );
  const operations = [...upserts];

  //TODO: how do we want to delete stale properties? delete manifests with that property if can't be found in repos_branches? but if can't be found in repos_branches.. then won't know what searchproperty is
  //TODO: make sure url of manifest doesn't have excess leading slashes(as done in getManifests)

  //check property types

  console.info(`Starting transaction`);
  assert.strictEqual(typeof manifest.global, "boolean");
  assert.strictEqual(typeof hash, "string");
  assert.ok(hash);

  if (operations.length > 0) {
    const bulkWriteStatus = await documentsColl?.bulkWrite(operations, {
      ordered: false,
    });
    status.deleted += bulkWriteStatus?.deletedCount ?? 0;
    status.upserted += bulkWriteStatus?.upsertedCount ?? 0;
  }
  await teardown();
  return status;
};
