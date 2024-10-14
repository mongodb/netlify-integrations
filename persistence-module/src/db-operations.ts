import type * as mongodb from 'mongodb';
import { db } from './connector';

export const bulkWrite = async (
  operations: mongodb.AnyBulkWriteOperation[],
  collection: string,
) => {
  const dbSession = await db();
  try {
    if (!operations || !operations.length) {
      return;
    }
    return dbSession
      .collection(collection)
      .bulkWrite(operations, { ordered: false });
  } catch (error) {
    console.error(`Error at bulk write time for ${collection}: ${error}`);
    throw error;
  }
};
