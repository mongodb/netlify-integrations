import type { Db } from "mongodb";
import * as mongodb from "mongodb";
import { DatabaseDocument } from "../types";

// We should only ever have one client active at a time.

// cached db object, so we can handle initial connection process once if unitialized

const ATLAS_CLUSTER0_URI = `mongodb+srv://${process.env.MONGO_ATLAS_USERNAME}:${process.env.MONGO_ATLAS_PASSWORD}@${process.env.MONGO_ATLAS_CLUSTER0_HOST}/?retryWrites=true&w=majority`;
const SNOOTY_DB_NAME = `${process.env.MONGO_ATLAS_POOL_DB_NAME}`;

const ATLAS_SEARCH_URI = `mongodb+srv://${process.env.MONGO_ATLAS_USERNAME}:${process.env.MONGO_ATLAS_PASSWORD}@${process.env.MONGO_ATLAS_SEARCH_HOST}/?retryWrites=true&w=majority`;
//TODO: change these teamwide env vars in Netlify UI when ready to move to prod
const SEARCH_DB_NAME = `${process.env.MONGO_ATLAS_SEARCH_DB_NAME}`;

let searchDbClient: mongodb.MongoClient;
let snootyDbClient: mongodb.MongoClient;

export const teardown = async (client: mongodb.MongoClient) => {
  await client.close();
};

export const closeSnootyDb = async () => {
  if (snootyDbClient) teardown(snootyDbClient);
  else {
    console.log("No client connection open to Snooty Db");
  }
};

export const closeSearchDb = async () => {
  if (searchDbClient) teardown(searchDbClient);
  else {
    console.log("No client connection open to Snooty Db");
  }
};

// Handles memoization of db object, and initial connection logic if needs to be initialized
export const db = async ({ uri, dbName }: { uri: string; dbName: string }) => {
  const client = new mongodb.MongoClient(uri);
  try {
    await client.connect();
    console.log(client);
    const dbInstance = client.db(dbName);
    return dbInstance;
  } catch (error) {
    const err = `Error at db client connection: ${error} for uri ${uri} and db name ${dbName}`;
    console.error(err);
    throw err;
  }
};

export const getSearchDb = async () => {
  const uri = ATLAS_SEARCH_URI;
  const dbName = SEARCH_DB_NAME;
  const searchDbClient = db({ uri, dbName });
  return searchDbClient;
};

export const getSnootyDb = async () => {
  const uri = ATLAS_CLUSTER0_URI;
  const dbName = SNOOTY_DB_NAME;
  const snootyDbClient = db({ uri, dbName });
  return snootyDbClient;
};

export const getCollection = (dbSession: Db, collection: string) => {
  try {
    return dbSession.collection<DatabaseDocument>(collection);
  } catch (e) {
    throw new Error(
      `Error getting ${collection} collection from client: ${dbSession}`
    );
  }
};
