import { Db } from "mongodb";
import { db } from "./searchConnector";
import { DatabaseDocument } from "./types";

// helper function to find the
const getBranch = (branches: any, branchName: string) => {
  for (let branchObj of branches) {
    if (branchObj.gitBranchName == branchName) {
      return branchObj;
    }
  }
  throw new Error(
    `Current branch ${branchName} not found in repos branches entry`
  );
};

// get whether branch is stable as well - set global from this?
const getProperties = async (branchName: string) => {
  const ATLAS_CLUSTER0_URI = `mongodb+srv://${process.env.MONGO_ATLAS_USERNAME}:${process.env.MONGO_ATLAS_PASSWORD}@${process.env.MONGO_ATLAS_CLUSTER0_HOST}/?retryWrites=true&w=majority`;
  //TODO: change these teamwide env vars in Netlify UI when ready to move to prod
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
      .project({ _id: 0, project: 1, search: 1, branches: 1 })
      .toArray();
  } catch (e) {
    console.error(`Error while getting repos_branches entry in Atlas: ${e}`);
    throw e;
  }

  if (repo.length) {
    const project = repo[0].project;

    try {
      const {
        urlSlug,
        gitBranchName,
        isStableBranch,
        active,
      }: {
        urlSlug: string;
        gitBranchName: string;
        isStableBranch: boolean;
        active: boolean;
      } = getBranch(repo[0].branches, branchName);
      includeInGlobalSearch = isStableBranch;
      version = urlSlug || gitBranchName;
      searchProperty = `${project}-${version}`;

      //TODO: check if repo, branch is active
      if (!repo[0].prodDeployable || !repo[0].search?.categoryTitle) {
        //add operations with deletestaledocuments and deletestaleproperties
        //return nothing because manifest can't be generated
      } else if (!active) {
        //version isn't active
        //add operations with deletestaledocuments and deletestaleproperties
        //return nothing because manifest shouldn't be generated
      }
    } catch (e) {
      console.error(`Error while getting branch entry`);
      console.log(e);
    }

    try {
      const docsetsQuery = { project: { $eq: project } };
      docsetRepo = await docsets?.find(docsetsQuery).toArray();
      if (docsetRepo.length) {
        url = docsetRepo[0].url.dotcomprd + docsetRepo[0].prefix.dotcomprd;
      }
    } catch (e) {
      console.error(`Error while getting docsets entry in Atlas ${e}`);
      throw e;
    }
  } else {
    //return nothing because manifest can't be generated from empty repo entry
    //throw error?
  }
  return { searchProperty, url, includeInGlobalSearch };
};

export default getProperties;
