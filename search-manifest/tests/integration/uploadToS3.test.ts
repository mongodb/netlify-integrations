import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
	PutObjectCommand,
	PutObjectCommandOutput,
	S3Client,
} from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import { getManifest } from '../utils/getManifest';
import { uploadManifestToS3 } from '../../src/uploadToS3/uploadManifest';

const MANIFEST = await getManifest('node');
const PROJECT_NAME = `node`;
const BRANCH = `master`;

const output: PutObjectCommandOutput = {
	$metadata: {
		httpStatusCode: 200,
		requestId: 'MPCZN4GMCM56ZCQT',
		extendedRequestId:
			'iMY6089hIWIjGiAJbiGfHooJfUCjUbKd7s12b7xo3p+U2SBRLHVNOPfWLi1/LbpHRhD5R65V7Lw=',
		attempts: 1,
		totalRetryDelay: 0,
	},
	ETag: '"7af17bccdfeee6b7550e235c098a01d3"',
	ServerSideEncryption: 'AES256',
};

beforeEach(async () => {
	const s3Mock = mockClient(S3Client);
	s3Mock.on(PutObjectCommand).resolves(output);
	vi.mock('../../src/uploadToS3/connectToS3.ts', async () => {
		return {
			connectToS3: () => {
				return new S3Client({});
			},
		};
	});
});

describe('upload manifest to S3 behaves as expected', () => {
	const uploadParams = {
		bucket: 'docs-search-indexes-test',
		prefix: 'search-indexes/ab-testing',
		fileName: `${PROJECT_NAME}-${BRANCH}.json`,
		manifest: MANIFEST.export(),
	};

	test('given sufficient parameters, upload to S3 resolves', async () => {
		expect(uploadManifestToS3(uploadParams)).resolves.toStrictEqual(output);
	});
});
