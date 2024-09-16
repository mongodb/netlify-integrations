import {
  describe,
  beforeEach,
  expect,
  test,
  vi,
  beforeAll,
  afterAll,
} from "vitest";
import {
  getProperties,
  getBranch,
} from "../../src/uploadToAtlas/getProperties";
import { mockDb, teardownMockDbClient, insert } from "../utils/mockDB";
// simulate the repos_branches collection in an object
import repos_branches from "../resources/mockCollections/repos-branches.json";
//simulate the docsests collection in an object
import docsets from "../resources/mockCollections/docsets.json";
import * as mongodb from "mongodb";
import { DatabaseDocument } from "../../src/uploadToAtlas/types";
import { Manifest } from "../../src/generateManifest/manifest";
import { getManifest } from "../utils/getManifest";
import { uploadManifest } from "../../src/uploadToAtlas/uploadManifest";

const BRANCH_NAME_MASTER = "master";
const BRANCH_NAME_BETA = "beta";
const BRANCH_NAME_GIBBERISH = "gibberish";
let db: mongodb.Db;

const repoNames = [
  "docs-compass",
  "cloud-docs",
  "docs-app-services",
  "docs-mongodb-internal",
];

beforeAll(async () => {
  process.env.REPO_NAME = repoNames[0];
  db = await mockDb();
  await insert(db, "repos_branches", repos_branches);
  await insert(db, "docsets", docsets);
});

const removeDocuments = async () => {
  //delete all documents in repo
  await db.collection<DatabaseDocument>("repos_branches").deleteMany({});
  const documentCount = await db
    .collection<DatabaseDocument>("repos_branches")
    .estimatedDocumentCount();
  await db.collection<DatabaseDocument>("documents").deleteMany({});

  return documentCount;
};

//mock repos_branches database
beforeEach(async () => {
  vi.mock("../../src/uploadToAtlas/searchConnector", async () => {
    const { mockDb, teardownMockDbClient } = await import("../utils/mockDB");
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
  await removeDocuments();
  await teardownMockDbClient();
});

describe("given an array of branches and a branch name, the corrct output is returned", () => {
  //mock branches object
  const branches: any = repos_branches[1].branches;
  test("given a branch name that exists in the branches array, the correct branch object is returned", () => {
    expect(getBranch(branches, BRANCH_NAME_MASTER)).toEqual({
      gitBranchName: "master",
      isStableBranch: true,
      urlSlug: "current",
      active: true,
    });
  });

  test("given a branch name that exists with different capitalization than in the branches array, the correct branch object is still returned", () => {
    expect(getBranch(branches, "MASTER")).toEqual({
      gitBranchName: "master",
      isStableBranch: true,
      urlSlug: "current",
      active: true,
    });
  });

  test("given a branch name that doesn't exist in the branches array, an error is thrown", () => {
    expect(() => getBranch(branches, BRANCH_NAME_GIBBERISH)).toThrow(
      `Current branch ${BRANCH_NAME_GIBBERISH} not found in repos branches entry`
    );
  });
  test("given a branch name and an empty branches array, an error is thrown", () => {
    expect(() => getBranch([], BRANCH_NAME_MASTER)).toThrow(
      `Current branch ${BRANCH_NAME_MASTER} not found in repos branches entry`
    );
  });
});

//two tests for a repo with multiple branches, one test for a repo with only one branch
describe("Given a branchname, get the properties associated with it from repos_branches", () => {
  //mock repo name
  test(`correct properties are retrieved for branch ${BRANCH_NAME_MASTER} of repoName ${repoNames[0]}`, async () => {
    //define expected properties object for master branch of Compass repo
    process.env.REPO_NAME = repoNames[0];
    const compassMasterProperties = {
      searchProperty: "compass-current",
      url: "http://mongodb.com/docs/compass",
      includeInGlobalSearch: true,
    };
    expect(await getProperties(BRANCH_NAME_MASTER)).toEqual(
      compassMasterProperties
    );
  });

  //change to two properties from different example repo
  // test(`correct properties are retrieved for branch ${BRANCH_NAME_BETA} of repoName ${repoNames[0]}`, async () => {
  //   //define expected properties object for beta branch of Compass repo
  //   process.env.REPO_NAME = repoNames[0];
  //   const compassBetaProperties = {
  //     searchProperty: "compass-upcoming",
  //     url: "http://mongodb.com/docs/compass",
  //     includeInGlobalSearch: false,
  //   };

  //   expect(await getProperties(BRANCH_NAME_BETA)).toEqual(
  //     compassBetaProperties
  //   );
  // });

  test(`correct properties are retrieved for branch ${BRANCH_NAME_MASTER} of repoName ${repoNames[1]}`, async () => {
    //define expected properties object for master branch of cloud-docs repo
    process.env.REPO_NAME = repoNames[1];
    const cloudDocsMasterProperties = {
      searchProperty: "cloud-docs-master",
      url: "http://mongodb.com/docs/atlas",
      includeInGlobalSearch: true,
    };

    expect(await getProperties(BRANCH_NAME_MASTER)).toEqual(
      cloudDocsMasterProperties
    );
  });
});

describe("GetProperties behaves as expected for stale properties", async () => {
  db = await mockDb();
  const documentsColl = db.collection<DatabaseDocument>("documents");

  beforeAll(async () => {
    const manifest1 = await getManifest("mms-master");
    await uploadManifest(manifest1, "mms-docs-master");
    const manifest2 = await getManifest("mms-v1.3");
    await uploadManifest(manifest1, "mms-docs-v1.3");

    db = await mockDb();
    let documentCount = await db
      .collection<DatabaseDocument>("documents")
      .estimatedDocumentCount();
    expect(documentCount).toEqual(1296);
  });

  afterAll(async () => {
    await removeDocuments();
  });

  //TODO
  test("getting properties for an inactive branch with no existing documents executes correctly and does not change db document count", async () => {
    db = await mockDb();
    let documentCount;
    documentCount = await db
      .collection<DatabaseDocument>("documents")
      .estimatedDocumentCount();
    //getProperties for beta
    process.env.repo_name = "docs-compass";
    await expect(getProperties(BRANCH_NAME_BETA)).rejects.toThrow();
    console.log(documentCount);
    expect(
      await db
        .collection<DatabaseDocument>("documents")
        .estimatedDocumentCount()
    ).toEqual(documentCount);
  });

  test("non prod-deployable repo throws and doesn't return properties", async () => {
    process.env.REPO_NAME = repoNames[3];
    //TODO: expect deleteproperties to be called
    //throws
    await expect(getProperties("v5.0")).rejects.toThrow(
      `Search manifest should not be generated for repo ${process.env.REPO_NAME}. Removing all associated manifests`
    );
  });

  test(`no properties are retrieved for branch on repo ${repoNames[2]} without a "search" field. `, async () => {
    //define expected properties object for master branch of docs-app-services repo
    process.env.REPO_NAME = repoNames[2];
    await expect(getProperties(BRANCH_NAME_MASTER)).rejects.toThrow();
  });

  test("repo with no search categoryTitle removes all old documents with search properties beginning with that project name", async () => {
    //add documents for project from two diff branches to search DB
    db = await mockDb();
    let documentCount;

    //trying to get properties for repo removes those older documents
    process.env.repo_name = "mms-docs";
    await expect(getProperties(BRANCH_NAME_MASTER)).rejects.toThrow();
    //throws
    //no return type

    db = await mockDb();
    const doc = await db.collection<DatabaseDocument>("documents").findOne();
    //TODO
    documentCount = await db
      .collection<DatabaseDocument>("documents")
      .estimatedDocumentCount();
    expect(documentCount).toEqual(0);
  });

  //TODO:
  test("getting properties for an inactive branch removes all old documents with that exact project-version searchProperty", () => {
    //add documents for project from two diff branches to DB-- docs-compass master and beta
    //trying to get properties for repo removes only the older documents from that specific branch, beta
    //throws
    //no return type
  });
});
