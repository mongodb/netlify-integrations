// Service that holds responsibility for initializing and exposing mdb interfaces.
// Also exports helper functions for common operations (insert, upsert one by _id, etc.)
// When adding helpers here, ask yourself if the helper will be used by more than one service
// If no, the helper should be implemented in that service, not here

import { Db } from "mongodb";
import * as mongodb from "mongodb";

// We should only ever have one client active at a time.

console.log("initiating db");

// export const teardown = async () => {
//   await client.close();
// };

// cached db object, so we can handle initial connection process once if unitialized
let dbInstance: Db;
let client: mongodb.MongoClient;

// Handles memoization of db object, and initial connection logic if needs to be initialized
export const db = async (uri: string, db_name: string) => {
  client = new mongodb.MongoClient(uri);
  try {
    await client.connect();
    dbInstance = client.db(db_name);
  } catch (error) {
    console.error(`Error at db client connection: ${error}`);
    throw error;
  }
  return dbInstance;
};
