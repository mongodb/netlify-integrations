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
import { DatabaseDocument } from "../../src/uploadToAtlas/types";

const BRANCH_NAME_MASTER = "master";
const BRANCH_NAME_BETA = "beta";
const BRANCH_NAME_GIBBERISH = "gibberish";

const repoNames = ["docs-compass", "cloud-docs", "docs-app-services"];

beforeAll(async () => {
  process.env.REPO_NAME = repoNames[0];
  const db = await mockDb();
  await insert(db, "repos_branches", repos_branches);
  await insert(db, "docsets", docsets);
});

const removeDocuments = async () => {
  //delete all documents in repo
  const db = await mockDb();
  await db.collection<DatabaseDocument>("repos_branches").deleteMany({});
  const documentCount = await db
    .collection<DatabaseDocument>("repos_branches")
    .estimatedDocumentCount();
  return documentCount;
};

//mock repos_branches database
beforeEach(async () => {
  vi.mock("../../src/uploadToAtlas/searchConnector", async () => {
    const { mockDb, teardownMockDbClient } = await import("../utils/mockDB");
    return {
      teardown: teardownMockDbClient,
      db: async () => {
        //create mock db of repos_branches. populate it with the repos branches object, docsets obj defined here
        const db = await mockDb();
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
    });
  });

  test("given a branch name that exists with different capitalization than in the branches array, the correct branch object is still returned", () => {
    expect(getBranch(branches, "MASTER")).toEqual({
      gitBranchName: "master",
      isStableBranch: true,
      urlSlug: "current",
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

  test(`correct properties are retrieved for branch ${BRANCH_NAME_BETA} of repoName ${repoNames[0]}`, async () => {
    //define expected properties object for beta branch of Compass repo
    process.env.REPO_NAME = repoNames[0];
    const compassBetaProperties = {
      searchProperty: "compass-upcoming",
      url: "http://mongodb.com/docs/compass",
      includeInGlobalSearch: false,
    };

    expect(await getProperties(BRANCH_NAME_BETA)).toEqual(
      compassBetaProperties
    );
  });

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

  test(`no properties are retrieved for branch on repo ${repoNames[2]} without a "search" field. `, async () => {
    //define expected properties object for master branch of docs-app-services repo
    process.env.REPO_NAME = repoNames[2];
    await expect(getProperties(BRANCH_NAME_MASTER)).rejects.toThrow();
  });
});
