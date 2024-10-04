import type { Db } from "mongodb";
import * as mongodb from "mongodb";
import type { SearchDocument } from "../types";
import { getEnvVars } from "../assertEnvVars";

const ENV_VARS = getEnvVars();

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
    const err = `Error at client connection: ${error} `;
    console.error(err);
    throw err;
  }
};

export const getSearchDb = async () => {
  console.log("Getting Search Db");
  const uri = ENV_VARS.ATLAS_SEARCH_URI;
  const dbName = ENV_VARS.SEARCH_DB_NAME;
  if (searchDb) {
    console.log("Search Db client already exists, using existing instance");
  } else {
    searchDb = await dbClient(uri);
  }
  return searchDb.db(dbName);
};

export const getSnootyDb = async () => {
  console.log("Getting Snooty Db");
  const uri = ENV_VARS.ATLAS_CLUSTER0_URI;
  const dbName = ENV_VARS.SNOOTY_DB_NAME;

  if (snootyDb) {
    console.log("Snooty Db client already exists, using existing instance");
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
  return dbSession.collection<SearchDocument>(ENV_VARS.DOCSETS_COLLECTION);
};

export const getReposBranchesCollection = async () => {
  const dbSession = await getSnootyDb();
  return dbSession.collection<SearchDocument>(
    ENV_VARS.REPOS_BRANCHES_COLLECTION
  );
};

export const getDocumentsCollection = async () => {
  const dbSession = await getSearchDb();
  return dbSession.collection<SearchDocument>(ENV_VARS.DOCUMENTS_COLLECTION);
};
