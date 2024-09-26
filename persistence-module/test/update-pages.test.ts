import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	GITHUB_USER,
	type Page,
	type UpdatedPage,
	updatePages,
} from '../src/update-pages';
import { getMockDb } from './utils/mockDb';

const COLLECTION_NAME = 'updated_documents';

beforeEach(async () => {
	vi.mock('../src/connector', async () => {
		const { getMockDb, teardownMockDbClient } = await import('./utils/mockDb');

		return {
			teardown: teardownMockDbClient,
			db: async () => {
				const db = await getMockDb();
				return db;
			},
		};
	});
});

afterEach(async () => {
	const { teardownMockDbClient } = await import('./utils/mockDb');

	await teardownMockDbClient();
});

describe('Update Pages Unit Tests', () => {
	it('inserts a new document', async () => {
		const testPages: Page[] = [
			{
				page_id: 'page0.txt',
				filename: 'page0.txt',
				github_username: GITHUB_USER,
				source: '',
				ast: {
					type: 'root',
					fileid: 'page0.txt',
					options: {},
					children: [],
					foo: 'foo',
					bar: { foo: 'foo' },
					position: {
						start: {
							line: {
								$numberInt: '0',
							},
						},
					},
				},
				static_assets: [],
			},
		];
		await updatePages(testPages, COLLECTION_NAME);

		const db = await getMockDb();
		const updatedDocuments = db.collection(COLLECTION_NAME);
		const documentsCursor = updatedDocuments.find<UpdatedPage>({});
		const documents = [];
		for await (const doc of documentsCursor) {
			documents.push(doc);
		}

		expect(documents.length).toEqual(1);
		const document = documents[0];

		expect(document.created_at.getTime()).toEqual(
			document.updated_at.getTime(),
		);
	});
	it('updates the original document and provides a new time stamp', async () => {
		const testPages: Page[] = [
			{
				page_id: 'page0.txt',
				filename: 'page0.txt',
				github_username: GITHUB_USER,
				source: '',
				ast: {
					type: 'root',
					fileid: 'page0.txt',
					options: {},
					children: [],
					foo: 'foo',
					bar: { foo: 'foo' },
					position: {
						start: {
							line: {
								$numberInt: '0',
							},
						},
					},
				},
				static_assets: [],
			},
		];
		const NUM_RUNS = 2;
		for (let i = 0; i < NUM_RUNS; i++) {
			await updatePages(testPages, COLLECTION_NAME);

			let now = new Date().getTime();

			const oneSecLater = now + 1000;

			while (now < oneSecLater) {
				now = new Date().getTime();
			}
		}

		const db = await getMockDb();
		const updatedDocuments = db.collection(COLLECTION_NAME);
		const documentsCursor = updatedDocuments.find<UpdatedPage>({});
		const documents = [];
		for await (const doc of documentsCursor) {
			documents.push(doc);
		}

		expect(documents.length).toEqual(1);
		const document = documents[0];

		expect(document.created_at.getTime()).toBeLessThan(
			document.updated_at.getTime(),
		);
	});
});
