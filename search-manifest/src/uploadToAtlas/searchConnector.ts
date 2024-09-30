import type { Db } from "mongodb";
import * as mongodb from "mongodb";
import type { DatabaseDocument } from "../types";

// We should only ever have one client active at a time.

// cached db object, so we can handle initial connection process once if unitialized

const ATLAS_CLUSTER0_URI = `mongodb+srv://${process.env.MONGO_ATLAS_USERNAME}:${process.env.MONGO_ATLAS_PASSWORD}@${process.env.MONGO_ATLAS_CLUSTER0_HOST}/?retryWrites=true&w=majority`;
const SNOOTY_DB_NAME = `${process.env.MONGO_ATLAS_POOL_DB_NAME}`;

const ATLAS_SEARCH_URI = `mongodb+srv://${process.env.MONGO_ATLAS_USERNAME}:${process.env.MONGO_ATLAS_PASSWORD}@${process.env.MONGO_ATLAS_SEARCH_HOST}/?retryWrites=true&w=majority`;
const SEARCH_DB_NAME = `${process.env.MONGO_ATLAS_SEARCH_DB_NAME}`;

const REPOS_BRANCHES_COLLECTION = "repos_branches";
const DOCSETS_COLLECTION = "docsets";
const DOCUMENTS_COLLECTION = "documents";

let searchDb: mongodb.MongoClient;
let snootyDb: mongodb.MongoClient;

export const teardown = async (client: mongodb.MongoClient) => {
  await client.close();
};

// Handles memoization of db object, and initial connection logic if needs to be initialized
export const dbClient = async (uri: string) => {
  const client = new mongodb.MongoClient(uri);
  try {
    await client.connect();
    return client;
  } catch (error) {
    const err = `Error at client connection: ${error} for uri ${uri} `;
    console.error(err);
    throw err;
  }
};

export const getSearchDb = async () => {
  console.log("getting search db");
  const uri = ATLAS_SEARCH_URI;
  const dbName = SEARCH_DB_NAME;
  if (searchDb) {
    console.log("search db client already exists, using existing instance");
  } else {
    searchDb = await dbClient(uri);
  }
  return searchDb.db(dbName);
};

export const getSnootyDb = async () => {
  console.log("getting snooty db");
  const uri = ATLAS_CLUSTER0_URI;
  const dbName = SNOOTY_DB_NAME;

  if (snootyDb) {
    console.log("snooty db client already exists, using existing instance");
  } else {
    snootyDb = await dbClient(uri);
  }
  return snootyDb.db(dbName);
};

export const closeSnootyDb = async () => {
  if (snootyDb) await teardown(snootyDb);
  else {
    console.log("No client connection open to Snooty Db");
  }
};

export const closeSearchDb = async () => {
  if (searchDb) await teardown(searchDb);
  else {
    console.log("No client connection open to Search Db");
  }
};

export const getDocsetsCollection = async () => {
  const dbSession = await getSnootyDb();
  return dbSession.collection<DatabaseDocument>(DOCSETS_COLLECTION);
};

export const getReposBranchesCollection = async () => {
  const dbSession = await getSnootyDb();
  return dbSession.collection<DatabaseDocument>(REPOS_BRANCHES_COLLECTION);
};

export const getDocumentsCollection = async () => {
  const dbSession = await getSearchDb();
  return dbSession.collection<DatabaseDocument>(DOCUMENTS_COLLECTION);
};
