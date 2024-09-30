export const deleteStaleDocuments = async ({
  searchProperty,
  manifestRevisionId,
}: {
  searchProperty: string;
  manifestRevisionId: string;
}) => {
  console.log(
    `Removing stale documents with search property ${searchProperty} `
  );
  return {
    deleteMany: {
      filter: {
        searchProperty: searchProperty,
        manifestRevisionId: { $ne: manifestRevisionId },
      },
    },
  };
};

import { getSearchDb } from "./searchConnector";
import type { DatabaseDocument } from "../types";

const ATLAS_SEARCH_URI = `mongodb+srv://${process.env.MONGO_ATLAS_USERNAME}:${process.env.MONGO_ATLAS_PASSWORD}@${process.env.MONGO_ATLAS_SEARCH_HOST}/?retryWrites=true&w=majority`;

//TODO: change these teamwide env vars in Netlify UI when ready to move to prod
const SEARCH_DB_NAME = `${process.env.MONGO_ATLAS_SEARCH_DB_NAME}`;

export const deleteStaleProperties = async (searchProperty: string) => {
  const dbSession = await getSearchDb();
  const documentsColl = dbSession.collection<DatabaseDocument>("documents");
  console.debug(`Removing all documents with stale property ${searchProperty}`);
  const query = { searchProperty: { $regex: searchProperty } };
  const status = await documentsColl?.deleteMany(query);
  return status;
};
