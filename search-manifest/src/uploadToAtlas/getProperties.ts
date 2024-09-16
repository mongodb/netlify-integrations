import { Db } from "mongodb";
import { db, teardown } from "./searchConnector";
import { DatabaseDocument } from "./types";

// helper function to find the associated branch
export const getBranch = (branches: any, branchName: string) => {
  for (let branchObj of branches) {
    //normalize for casing
    if (branchObj.gitBranchName.toLowerCase() == branchName.toLowerCase()) {
      return branchObj;
    }
  }
  throw Error(`Current branch ${branchName} not found in repos branches entry`);
};

export const getProperties = async (branchName: string) => {
  const ATLAS_CLUSTER0_URI = `mongodb+srv://${process.env.MONGO_ATLAS_USERNAME}:${process.env.MONGO_ATLAS_PASSWORD}@${process.env.MONGO_ATLAS_CLUSTER0_HOST}/?retryWrites=true&w=majority`;
  const SNOOTY_DB_NAME = `${process.env.MONGO_ATLAS_POOL_DB_NAME}`;
  const REPO_NAME = process.env.REPO_NAME;

  //check that an environment variable for repo name was set
  if (!REPO_NAME) {
    throw new Error(
      "No repo name supplied as environment variable, manifest cannot be uploaded to Atlas Search.Documents collection "
    );
  }

  let dbSession: Db;
  let repos_branches;
  let docsets;
  let url: string = "";
  let searchProperty: string = "";
  let includeInGlobalSearch: boolean = false;
  let repo: any;
  let docsetRepo: any;
  let version: string;

  try {
    //Conenct to database and get repos_branches, docsets collections
    dbSession = await db(ATLAS_CLUSTER0_URI, SNOOTY_DB_NAME);
    repos_branches = dbSession.collection<DatabaseDocument>("repos_branches");
    docsets = dbSession.collection<DatabaseDocument>("docsets");
  } catch (e) {
    console.log("issue starting session for Snooty Pool Database", e);
  }

  const query = {
    repoName: REPO_NAME,
  };

  try {
    repo = await repos_branches
      ?.find(query)
      .project({
        _id: 0,
        project: 1,
        search: 1,
        branches: 1,
        prodDeployable: 1,
        internalOnly: 1,
      })
      .toArray();
    if (repo?.length) repo = repo[0];
    else
      throw new Error(
        `Could not get repos_branches entry for repo ${REPO_NAME}, ${repo}, ${JSON.stringify(
          query
        )}`
      );
  } catch (e) {
    console.error(`Error while getting repos_branches entry in Atlas: ${e}`);
    throw e;
  }

  const project = repo.project;

  try {
    const {
      urlSlug,
      gitBranchName,
      isStableBranch,
    }: {
      urlSlug: string;
      gitBranchName: string;
      isStableBranch: boolean;
      active: boolean;
    } = getBranch(repo.branches, branchName);
    includeInGlobalSearch = isStableBranch;
    version = urlSlug || gitBranchName;
    searchProperty = `${project}-${version}`;

    if (
      repo.internalOnly ||
      !repo.prodDeployable ||
      !repo.search?.categoryTitle
    ) {
      //TODO: deletestaleproperties here potentially instead of throwing or returning
      throw new Error(
        `Search manifest should not be generated for repo ${REPO_NAME}`
      );
    }
  } catch (e) {
    console.error(`Error`, e);
    throw e;
  }

  try {
    const docsetsQuery = { project: { $eq: project } };
    docsetRepo = await docsets?.find(docsetsQuery).toArray();
    if (docsetRepo.length) {
      //TODO: change based on environment
      url = docsetRepo[0].url?.dotcomprd + docsetRepo[0].prefix.dotcomprd;
    }
  } catch (e) {
    console.error(`Error while getting docsets entry in Atlas ${e}`);
    throw e;
  }
  await teardown();
  return { searchProperty, url, includeInGlobalSearch };
};

export default getProperties;
