import type { Db } from "mongodb";
import * as mongodb from "mongodb";
import { DatabaseDocument } from "../types";

// We should only ever have one client active at a time.

// cached db object, so we can handle initial connection process once if unitialized
let dbInstance: Db;
let client: mongodb.MongoClient;

export const teardown = async () => {
  await client.close();
};

// Handles memoization of db object, and initial connection logic if needs to be initialized
export const db = async ({ uri, dbName }: { uri: string; dbName: string }) => {
  client = new mongodb.MongoClient(uri);
  try {
    await client.connect();
    console.log(JSON.stringify(client));
    dbInstance = client.db(dbName);
  } catch (error) {
    const err = `Error at db client connection: ${error} for uri ${uri} and db name ${dbName}`;
    console.error(err);
    throw err;
  }
  return dbInstance;
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
