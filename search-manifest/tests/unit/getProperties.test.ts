import {
  describe,
  beforeEach,
  expect,
  test,
  vi,
  beforeAll,
  afterAll,
} from 'vitest';
import getProperties, {
  getBranch,
} from '../../src/uploadToAtlas/getProperties';
import {
  mockDb,
  teardownMockDbClient,
  insert,
  removeDocuments,
} from '../utils/mockDB';
// simulate the repos_branches collection in an object
import repos_branches from '../resources/mockCollections/repos-branches.json';
//simulate the docsests collection in an object
import docsets from '../resources/mockCollections/docsets.json';
import * as mongodb from 'mongodb';
import { BranchEntry, DatabaseDocument } from '../../src/types';
import { Manifest } from '../../src/generateManifest/manifest';
import { getManifest } from '../utils/getManifest';
import { uploadManifest } from '../../src/uploadToAtlas/uploadManifest';
import { afterEach } from 'node:test';

const BRANCH_NAME_MASTER = 'master';
const BRANCH_NAME_BETA = 'beta';
const BRANCH_NAME_GIBBERISH = 'gibberish';
let db: mongodb.Db;

const DOCS_COMPASS_NAME = 'docs-compass';
const DOCS_CLOUD_NAME = 'cloud-docs';
const DOCS_APP_SERVICES_NAME = 'docs-app-services';
const DOCS_MONGODB_INTERNAL_NAME = 'docs-mongodb-internal';

beforeAll(async () => {
  db = await mockDb();
  await insert(db, 'repos_branches', repos_branches);
  await insert(db, 'docsets', docsets);
});

//mock repos_branches database
beforeEach(async () => {
  vi.mock('../../src/uploadToAtlas/searchConnector', async () => {
    const { mockDb, teardownMockDbClient } = await import('../utils/mockDB');
    return {
      teardown: teardownMockDbClient,
      db: async () => {
        //mock db of repos_branches
        db = await mockDb();
        return db;
      },
    };
  });
});

afterAll(async () => {
  //teardown db instance
  await removeDocuments('repos_branches');
  await teardownMockDbClient();
});

describe('given an array of branches and a branch name, the corrct output is returned', () => {
  //mock branches object
  const branches: Array<BranchEntry> = repos_branches[1].branches;
  test('given a branch name that exists in the branches array, the correct branch object is returned', () => {
    expect(getBranch(branches, BRANCH_NAME_MASTER)).toEqual({
      gitBranchName: 'master',
      isStableBranch: true,
      urlSlug: 'current',
      active: true,
    });
  });

  test('given a branch name that exists with different capitalization than in the branches array, the correct branch object is still returned', () => {
    expect(getBranch(branches, 'MASTER')).toEqual({
      gitBranchName: 'master',
      isStableBranch: true,
      urlSlug: 'current',
      active: true,
    });
  });

  test("given a branch name that doesn't exist in the branches array, undefined is returned", () => {
    expect(() => getBranch(branches, BRANCH_NAME_GIBBERISH)).toThrowError(
      new Error(`Branch ${BRANCH_NAME_GIBBERISH} not found in branches object`),
    );
  });
  test('given a branch name and an empty branches array, undefined is returned', () => {
    expect(() => getBranch([], BRANCH_NAME_MASTER)).toThrowError(
      `Branch ${BRANCH_NAME_MASTER} not found in branches object`,
    );
  });
});

//two tests for a repo with multiple branches, one test for a repo with only one branch
describe('Given a branchname, get the properties associated with it from repos_branches', () => {
  //mock repo name
  test(`correct properties are retrieved for branch ${BRANCH_NAME_MASTER} of repoName ${DOCS_COMPASS_NAME}`, async () => {
    //define expected properties object for master branch of Compass repo
    process.env.REPO_NAME = DOCS_COMPASS_NAME;
    const compassMasterProperties = {
      searchProperty: 'compass-current',
      projectName: 'compass',
      url: 'http://mongodb.com/docs/compass/',
      includeInGlobalSearch: true,
    };
    expect(await getProperties(BRANCH_NAME_MASTER)).toEqual(
      compassMasterProperties,
    );
  });

  test(`correct properties are retrieved for branch ${BRANCH_NAME_MASTER} of repoName ${DOCS_CLOUD_NAME}`, async () => {
    //define expected properties object for master branch of cloud-docs repo
    process.env.REPO_NAME = DOCS_CLOUD_NAME;
    const cloudDocsMasterProperties = {
      searchProperty: 'atlas-master',
      projectName: 'cloud-docs',
      url: 'http://mongodb.com/docs/atlas/',
      includeInGlobalSearch: true,
    };

    expect(await getProperties(BRANCH_NAME_MASTER)).toEqual(
      cloudDocsMasterProperties,
    );
  });
});

describe(
  'GetProperties behaves as expected for stale properties',
  () => {
    afterEach(async () => {
      console.log(await removeDocuments('documents'));
    });

    test('getting properties for an inactive branch with no existing documents executes correctly and does not change db document count', async () => {
      //populate db with manifests
      db = await mockDb();
      const manifest1 = await getManifest('mms-master');
      await uploadManifest(manifest1, 'mms-docs-stable');
      //reopen connection to db
      await mockDb();
      //check number of documents initially in db
      const documentCount = await db
        .collection<DatabaseDocument>('documents')
        .countDocuments();

      //getProperties for beta doens't change number of documents in collection
      process.env.repo_name = 'docs-compass';
      await expect(getProperties(BRANCH_NAME_BETA)).rejects.toThrow();
      expect(
        await db.collection<DatabaseDocument>('documents').countDocuments(),
      ).toEqual(documentCount);
    });

    test("non prod-deployable repo throws and doesn't return properties", async () => {
      process.env.REPO_NAME = DOCS_MONGODB_INTERNAL_NAME;
      await expect(getProperties('v5.0')).rejects.toThrow(
        `Search manifest should not be generated for repo ${process.env.REPO_NAME}. Removing all associated manifests`,
      );
    });

    test(`no properties are retrieved for branch on repo ${DOCS_APP_SERVICES_NAME} without a "search" field. `, async () => {
      process.env.REPO_NAME = DOCS_MONGODB_INTERNAL_NAME;
      await expect(getProperties(BRANCH_NAME_MASTER)).rejects.toThrow();
    });

    test('repo with no search categoryTitle removes all old documents with search properties beginning with that project name', async () => {
      db = await mockDb();

      //add documents for project from two diff branches to search DB
      const manifest1 = await getManifest('mms-master');

      await uploadManifest(manifest1, 'mms-docs-stable');
      await mockDb();

      const manifest2 = await getManifest('mms-v1.3');
      await uploadManifest(manifest2, 'mms-docs-v1.3');

      await mockDb();

      //trying to get properties for repo removes those older documents
      process.env.REPO_NAME = 'mms-docs';
      const documentCount = await db
        .collection<DatabaseDocument>('documents')
        .countDocuments();
      await expect(getProperties(BRANCH_NAME_MASTER)).rejects.toThrow();
      //throws
      //no return type

      await mockDb();
      const documentCount2 = await db

        .collection<DatabaseDocument>('documents')
        .countDocuments();
      expect(documentCount2).toEqual(
        documentCount - manifest1.documents.length - manifest2.documents.length,
      );
    });

    test('getting properties for an inactive branch removes all old documents with that exact project-version searchProperty', async () => {
      //add documents for project from two diff branches to DB-- docs-compass master and beta
      db = await mockDb();
      //add documents for project from two diff branches to search DB
      const manifest1 = await getManifest('compass-master');

      await uploadManifest(manifest1, 'compass-current');
      await mockDb();

      const manifest2 = await getManifest('compass-beta');
      await uploadManifest(manifest2, 'compass-upcoming');
      await mockDb();

      //trying to get properties for repo removes only the older documents from that specific branch, beta
      let documentCount;
      let documentCount2;
      //trying to get properties for repo removes those older documents

      process.env.REPO_NAME = 'docs-compass';
      documentCount = await db
        .collection<DatabaseDocument>('documents')
        .countDocuments();
      await expect(getProperties(BRANCH_NAME_BETA)).rejects.toThrow();
      await mockDb();
      documentCount2 = await db
        .collection<DatabaseDocument>('documents')
        .countDocuments();
      expect(documentCount2).toEqual(
        documentCount - manifest2.documents.length,
      );
    });
  },
  { timeout: 10000 },
);
