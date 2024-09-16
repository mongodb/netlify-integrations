import { MongoMemoryServer } from 'mongodb-memory-server';
import * as mongodb from 'mongodb';

let client: mongodb.MongoClient;

export async function teardownMockDbClient() {
	if (!client) return;

	await client.close();
}

export async function mockDb(): Promise<mongodb.Db> {
	if (client) {
		await client.connect();
		return client.db('test_db');
	}
	const mongod = await MongoMemoryServer.create();
	const uri = mongod.getUri();
	client = new mongodb.MongoClient(uri);
	await client.connect();
	const dbInstance = client.db('test_db');
	return dbInstance;
}
