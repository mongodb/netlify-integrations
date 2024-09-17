import {
  describe,
  beforeEach,
  expect,
  test,
  vi,
  beforeAll,
  afterAll,
} from "vitest";
import getProperties, {
  _getBranch,
} from "../../src/uploadToAtlas/getProperties";
import {
  mockDb,
  teardownMockDbClient,
  insert,
  removeDocuments,
} from "../utils/mockDB";
// simulate the repos_branches collection in an object
import repos_branches from "../resources/mockCollections/repos-branches.json";
//simulate the docsests collection in an object
import docsets from "../resources/mockCollections/docsets.json";

const BRANCH_NAME_MASTER = "master";
const BRANCH_NAME_BETA = "beta";
const BRANCH_NAME_GIBBERISH = "gibberish";

const DOCS_COMPASS_NAME = "docs-compass";
const DOCS_CLOUD_NAME = "cloud-docs";
const DOCS_APP_SERVICES_NAME = "docs-app-services";

beforeAll(async () => {
  process.env.REPO_NAME = DOCS_COMPASS_NAME;
  const db = await mockDb();
  await insert(db, "repos_branches", repos_branches);
  await insert(db, "docsets", docsets);
});

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
  await removeDocuments("repos_branches");
  await teardownMockDbClient();
});

describe("given an array of branches and a branch name, the corrct output is returned", () => {
  //mock branches object
  const branches: any = repos_branches[1].branches;
  test("given a branch name that exists in the branches array, the correct branch object is returned", () => {
    expect(_getBranch(branches, BRANCH_NAME_MASTER)).toEqual({
      gitBranchName: "master",
      isStableBranch: true,
      urlSlug: "current",
    });
  });

  test("given a branch name that exists with different capitalization than in the branches array, the correct branch object is still returned", () => {
    expect(_getBranch(branches, "MASTER")).toEqual({
      gitBranchName: "master",
      isStableBranch: true,
      urlSlug: "current",
    });
  });

  test("given a branch name that doesn't exist in the branches array, undefined is returned", () => {
    expect(_getBranch(branches, BRANCH_NAME_GIBBERISH)).toEqual(undefined);
  });
  test("given a branch name and an empty branches array, undefined is returned", () => {
    expect(_getBranch([], BRANCH_NAME_MASTER)).toEqual(undefined);
  });
});

//two tests for a repo with multiple branches, one test for a repo with only one branch
describe("Given a branchname, get the properties associated with it from repos_branches", () => {
  //mock repo name
  test(`correct properties are retrieved for branch ${BRANCH_NAME_MASTER} of repoName ${DOCS_COMPASS_NAME}`, async () => {
    //define expected properties object for master branch of Compass repo
    process.env.REPO_NAME = DOCS_COMPASS_NAME;
    const compassMasterProperties = {
      searchProperty: "compass-current",
      url: "http://mongodb.com/docs/compass/",
      includeInGlobalSearch: true,
    };
    expect(await getProperties(BRANCH_NAME_MASTER)).toEqual(
      compassMasterProperties
    );
  });

  test(`correct properties are retrieved for branch ${BRANCH_NAME_BETA} of repoName ${DOCS_COMPASS_NAME}`, async () => {
    //define expected properties object for beta branch of Compass repo
    process.env.REPO_NAME = DOCS_COMPASS_NAME;
    const compassBetaProperties = {
      searchProperty: "compass-upcoming",
      url: "http://mongodb.com/docs/compass/",
      includeInGlobalSearch: false,
    };

    expect(await getProperties(BRANCH_NAME_BETA)).toEqual(
      compassBetaProperties
    );
  });

  test(`correct properties are retrieved for branch ${BRANCH_NAME_MASTER} of repoName ${DOCS_CLOUD_NAME}`, async () => {
    //define expected properties object for master branch of cloud-docs repo
    process.env.REPO_NAME = DOCS_CLOUD_NAME;
    const cloudDocsMasterProperties = {
      searchProperty: "atlas-master",
      url: "http://mongodb.com/docs/atlas/",
      includeInGlobalSearch: true,
    };

    expect(await getProperties(BRANCH_NAME_MASTER)).toEqual(
      cloudDocsMasterProperties
    );
  });

  test(`no properties are retrieved for branch on repo ${DOCS_APP_SERVICES_NAME} without a "search" field. `, async () => {
    //define expected properties object for master branch of docs-app-services repo
    process.env.REPO_NAME = DOCS_APP_SERVICES_NAME;
    await expect(getProperties(BRANCH_NAME_MASTER)).rejects.toThrow();
  });
});
