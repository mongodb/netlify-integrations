import { MongoMemoryServer } from "mongodb-memory-server";
import * as mongodb from "mongodb";

const mongod = new MongoMemoryServer();

export async function getMockDb() {
  const uri = mongod.getUri();
}
