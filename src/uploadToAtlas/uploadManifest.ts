import { Db } from "mongodb";
import { Manifest } from "../generateManifest/manifest";
import { db } from "./searchConnector";
import assert from "assert";
import { RefreshInfo, DatabaseDocument } from "./types";
import { generateHash, joinUrl } from "./utils";

const ATLAS_SEARCH_URI = `mongodb+srv://${process.env.MONGO_ATLAS_USERNAME}:${process.env.MONGO_ATLAS_PASSWORD}@${process.env.MONGO_ATLAS_SEARCH_HOST}/?retryWrites=true&w=majority&appName=Search`;
const ATLAS_CLUSTER0_URI = `mongodb+srv://${process.env.MONGO_ATLAS_USERNAME}:${process.env.MONGO_ATLAS_PASSWORD}@${process.env.MONGO_ATLAS_CLUSTER0_HOST}/?retryWrites=true&w=majority`;
//TODO: change these teamwide env vars in Netlify UI when ready to move to prod
const SNOOTY_DB_NAME = `${process.env.ATLAS_POOL_DB_NAME}`;
const SEARCH_DB_NAME = `${process.env.ATLAS_SEARCH_DB_NAME}`;

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
      lastModified: lastModified,
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

export const getProperties = async (name: string, branch: string) => {
  let dbSession: Db;
  let repos_branches;
  let docsets;
  let url: string = "";
  let searchProperty: string = "";
  let repo: any;
  let docsetRepo: any;

  try {
    dbSession = await db(ATLAS_CLUSTER0_URI, SNOOTY_DB_NAME);
    repos_branches = dbSession.collection<DatabaseDocument>("repos_branches");
    docsets = dbSession.collection<DatabaseDocument>("docsets");
  } catch (e) {
    console.log("issue starting session for Snooty Pool Database", e);
  }

  const query = {
    repoName: name,
  };

  try {
    repo = await repos_branches?.find(query).toArray();
  } catch (e) {
    console.error(`Error while getting repos_branches entry in Atlas: ${e}`);
    throw e;
  }

  if (repo?.length && repo[0].prodDeployable && repo[0].search) {
    const project = repo[0].project;
    searchProperty = repo[0].search.categoryTitle;
    try {
      const docsetsQuery = { project: { $eq: project } };
      docsetRepo = await docsets?.find(docsetsQuery).toArray();
      if (docsetRepo.length) {
        url = docsetRepo[0].url.dotcomprd + docsetRepo[0].prefix.dotcomprd;
      }
    } catch (e) {
      console.error(`Error while getting docsets entry in Atlas ${e}`);
      throw e;
    }
  }
  //check that repos exists, only one repo
  //TODO: make sure branch is active
  //if any of this is not true add operations with deletestaledocuments and deletestaleproperties
  return [searchProperty, url];
};

//handle overall upload of manifest to Atlas
export const uploadManifest = async (manifest: Manifest, branch: string) => {
  //check that manifest documents exist
  if (!manifest?.documents?.length) {
    return Promise.reject(new Error("Invalid manifest "));
  }
  //check that an environment variable for repo name was set
  const REPO_NAME = process.env.REPO_NAME;
  if (!REPO_NAME) {
    throw new Error(
      "No repo name found, manifest cannot be uploaded to Atlas Search.Documents collection "
    );
  }

  //get searchProperty, url
  const [searchProperty, url] = await getProperties(REPO_NAME, branch);
  manifest.url = url;

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
  const lastModified = new Date();

  const upserts = await composeUpserts(
    manifest,
    searchProperty,
    lastModified,
    hash
  );
  const operations = [...upserts];

  //TODO: how do we want to delete stale properties?
  //TODO: make sure url of manifest doesn't have excess leading slashes(as done in getManifests)

  //check property types

  console.info(`Starting transaction`);
  assert.strictEqual(typeof manifest.global, "boolean");
  assert.ok(manifest.global);
  assert.strictEqual(typeof hash, "string");
  assert.ok(hash);

  if (operations.length > 0) {
    const bulkWriteStatus = await documentsColl?.bulkWrite(operations, {
      ordered: false,
    });
    status.deleted += bulkWriteStatus?.deletedCount ?? 0;
    status.upserted += bulkWriteStatus?.upsertedCount ?? 0;
  }
  return status;
};
