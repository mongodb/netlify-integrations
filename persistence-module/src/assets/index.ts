import { bulkUpsertAll } from "../db-operations";
import { Page } from "../update-pages";

const COLLECTION_NAME = 'assets';

export const upsertAssets = async (assets: Page[]) => {
  const timerLabel = 'asset upsertion';
  console.time(timerLabel);
  try {
    return bulkUpsertAll(assets, COLLECTION_NAME);
  } catch (error) {
    console.error(`Error at upsertion time for ${COLLECTION_NAME}: ${error}`);
    throw error;
  } finally {
    console.timeEnd(timerLabel);
  }
};
