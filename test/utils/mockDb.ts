import { MongoMemoryServer } from "mongodb-memory-server";
import * as mongodb from "mongodb";

const mongod = new MongoMemoryServer();

let client: mongodb.MongoClient;

export async function teardownMockDb() {
  if (!client) return;

  await client.close();
}

export async function getMockDb() {
  if (client) return client;

  const uri = mongod.getUri();
  client = new mongodb.MongoClient(uri);
  await client.connect();

  return client;
}
