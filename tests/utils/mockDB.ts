import { MongoMemoryServer } from "mongodb-memory-server";
import * as mongodb from "mongodb";

let client: mongodb.MongoClient;

export async function teardownMockDbClient() {
  if (!client) return;

  await client.close();
}

export async function mockDb() {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  client = new mongodb.MongoClient(uri);
  await client.connect();
  return client.db("test_db");
}
