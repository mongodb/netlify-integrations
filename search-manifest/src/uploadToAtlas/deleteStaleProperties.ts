//   const deleteResult = await collection.deleteMany(
//     {
//       searchProperty: searchProperty,
//       manifestRevisionId: { $ne: manifestRevisionId },
//     },
//     { session }
//   );
//   status.deleted +=
//     deleteResult.deletedCount === undefined ? 0 : deleteResult.deletedCount;
//   console.debug(
//     `Removed ${deleteResult.deletedCount} entries from ${collection.collectionName}`
//   );

import { db } from "./searchConnector";
import { DatabaseDocument } from "./types";

const ATLAS_SEARCH_URI = `mongodb+srv://${process.env.MONGO_ATLAS_USERNAME}:${process.env.MONGO_ATLAS_PASSWORD}@${process.env.MONGO_ATLAS_SEARCH_HOST}/?retryWrites=true&w=majority`;

//TODO: change these teamwide env vars in Netlify UI when ready to move to prod
const SEARCH_DB_NAME = `${process.env.MONGO_ATLAS_SEARCH_DB_NAME}`;

//add session here for Search DB
export const deleteStaleProperties = async (searchProperty: string) => {
  const dbSession = await db(ATLAS_SEARCH_URI, SEARCH_DB_NAME);
  const documentsColl = dbSession.collection<DatabaseDocument>("documents");
  console.debug(`Removing old documents`);
  const query = { searchProperty: { $regex: searchProperty } };
  await documentsColl?.deleteMany(query);
};
