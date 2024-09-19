import * as mongodb from "mongodb";
import { db } from "./connector";
import { ObjectId } from "mongodb";

export const bulkWrite = async (
  operations: mongodb.AnyBulkWriteOperation[],
  collection: string
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
export const insert = async (docs: any[], collection: string, buildId: ObjectId, printTime = false) => {
  const timerLabel = `insert - ${collection}`;
  if (printTime) console.time(timerLabel);
  const insertSession = await db();
  try {
    return insertSession.collection(collection).insertMany(
      docs.map((d) => ({
        ...d,
        build_id: buildId,
        created_at: new Date(),
      })),
      { ordered: false }
    );
  } catch (error) {
    console.error(`Error at insertion time for ${collection}: ${error}`);
    throw error;
  } finally {
    if (printTime) console.timeEnd(timerLabel);
  }
};
