import { MongoMemoryServer } from "mongodb-memory-server";
import * as mongodb from "mongodb";
import { DatabaseDocument } from "../../src/uploadToAtlas/types";

let client: mongodb.MongoClient;

export async function teardownMockDbClient() {
  if (!client) return;
  await client.close();
}

export async function mockDb(): Promise<mongodb.Db> {
  if (client) {
    await client.connect();
    return client.db("dummy_db");
  }
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  client = new mongodb.MongoClient(uri);
  await client.connect();
  const dbInstance = client.db("dummy_db");
  return dbInstance;
}

export const insert = async (
  dbName: mongodb.Db,
  collectionName: string,
  docs: any[]
) => {
  const coll = dbName.collection(collectionName);
  const result = await coll.insertMany(docs);
  console.log(`${result.insertedCount} documents were inserted`);
};

export const removeDocuments = async (collectionName: string) => {
  //delete all documents in repo
  const db = await mockDb();
  await db.collection<DatabaseDocument>(collectionName).deleteMany({});
  const documentCount = await db
    .collection<DatabaseDocument>("documents")
    .countDocuments();
  return documentCount;
};
