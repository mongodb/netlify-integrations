import { Db } from "mongodb";
import * as mongodb from "mongodb";

// We should only ever have one client active at a time.

//TODO: teardown after no longer need client
// export const teardown = async () => {
//   await client.close();
// };

// cached db object, so we can handle initial connection process once if unitialized
let dbInstance: Db;
let client: mongodb.MongoClient;

// Handles memoization of db object, and initial connection logic if needs to be initialized
export const db = async (uri: string, db_name: string) => {
  client = new mongodb.MongoClient(uri);
  await client.connect();
  try {
    dbInstance = client.db(db_name);
  } catch (error) {
    console.error(
      `Error at db client connection: ${error} for uri ${uri} and db name ${db_name}`
    );
    throw error;
  }
  return dbInstance;
};
