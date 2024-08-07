// Service that holds responsibility for initializing and exposing mdb interfaces.
// Also exports helper functions for common operations (insert, upsert one by _id, etc.)
// When adding helpers here, ask yourself if the helper will be used by more than one service
// If no, the helper should be implemented in that service, not here

import { Db, MongoClient } from "mongodb";

// We should only ever have one client active at a time.
const atlasURL = `mongodb+srv://${process.env.MONGO_ATLAS_USERNAME}:${process.env.MONGO_ATLAS_PASSWORD}@${process.env.MONGO_ATLAS_HOST}/?retryWrites=true&w=majority&maxPoolSize=20`;
const client = await MongoClient.connect(atlasURL);

export const teardown = async () => {
  await client.close();
};

const SNOOTY_DB_NAME = "search-test-ab";

// cached db object, so we can handle initial connection process once if unitialized
let dbInstance: Db;
// Handles memoization of db object, and initial connection logic if needs to be initialized
export const db = async () => {
  console.log("initiating db");
  if (!dbInstance) {
    try {
      // const client = await MongoClient.connect(atlasUri);
      // const result = await client.connect();
      console.log("connected to db", client);
      dbInstance = client.db(SNOOTY_DB_NAME);
      console.log("CONNECTED TO DB", dbInstance);
    } catch (error) {
      console.error(`Error at db client connection: ${error}`);
      throw error;
    }
  }
  return dbInstance;
};
