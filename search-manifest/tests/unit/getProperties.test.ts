import { describe, beforeEach, expect, test, it, vi } from "vitest";
import {
  getProperties,
  getBranch,
} from "../../src/uploadToAtlas/getProperties";
import { mockDb } from "../utils/mockDB";
// simulate the repos_branches collection in an object
// TODO: add another one branch one that DOES have a search object}
import repos_branches from "../resources/mockCollections/repos-branches.json";
//simulate the docsests collection in an object
import docsets from "../resources/mockCollections/docsets.json";

const BRANCH_NAME_MASTER = "master";
const BRANCH_NAME_V1 = "v1.0";
const BRANCH_NAME_GIBBERISH = "gibberish";

const repoName = "";

//mock repos_branches database
beforeEach(async () => {
  vi.mock("../../src/uploadToAtlas/searchConnector", async () => {
    const { mockDb, teardownMockDbClient } = await import("../utils/mockDB");

    return {
      teardown: teardownMockDbClient,
      db: async () => {
        //create mock db of repos_branches. populate it with the repos branches object, docsets obj defined here
        const db = "";
        return db;
      },
    };
  });
});

describe("given an array of branches and a branch name, the corrct output is returned", () => {
  //mock branches object
  const branches: any = [];
  test("given a branch name that exists in the branches array, the correct branch object is returned", () => {
    expect(getBranch(branches, BRANCH_NAME_MASTER)).toEqual({});
  });
  test("given a branch name that exists with different capitalization than in the branches array, the correct branch object is still returned", () => {
    expect(getBranch(branches, "MASTER")).toEqual({});
  });
  test("given a branch name that doesn't exist in the branches array, an error is thrown", () => {
    expect(getBranch(branches, BRANCH_NAME_GIBBERISH)).toThrowError(
      `Current branch ${BRANCH_NAME_GIBBERISH} not found in repos branches entry`
    );
  });
  test("given a branch name and an empty branches array, an error is thrown", () => {
    expect(getBranch([], BRANCH_NAME_MASTER)).toThrowError(
      `Current branch ${BRANCH_NAME_MASTER} not found in repos branches entry`
    );
  });
});

//TODO: add another repoName and another test for it
//two tests for a repo with multiple branches, one test for a repo with only one branch
describe("Given a branchname, get the properties associated with it from repos_branches", () => {
  //mock repo name
  test(`correct properties are retrieved for branch ${BRANCH_NAME_MASTER} of repoName ${repoName}`, () => {
    //define expected properties object
    expect(getProperties(BRANCH_NAME_MASTER)).toEqual({});
  });
  test(`correct properties are retrieved for branch ${BRANCH_NAME_V1} of repoName ${repoName}`, () => {
    //define expected properties object
    expect(getProperties(BRANCH_NAME_MASTER)).toEqual({});
  });
});
