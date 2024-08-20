import { Db } from "mongodb";
import { db } from "./searchConnector";
import { DatabaseDocument } from "./types";

// get whether branch is stable as well - set global from this?
const getProperties = async () => {
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
  let repo: any;
  let docsetRepo: any;

  try {
    dbSession = await db(ATLAS_CLUSTER0_URI, SNOOTY_DB_NAME);
    console.log("got pool test db");
    repos_branches = dbSession.collection<DatabaseDocument>("repos_branches");
    docsets = dbSession.collection<DatabaseDocument>("docsets");
  } catch (e) {
    console.log("issue starting session for Snooty Pool Database", e);
  }

  const query = {
    repoName: REPO_NAME,
  };

  try {
    repo = await repos_branches?.find(query).toArray();
  } catch (e) {
    console.error(`Error while getting repos_branches entry in Atlas: ${e}`);
    throw e;
  }

  if (repo.length && repo[0].prodDeployable && repo[0].search) {
    const project = repo[0].project;
    searchProperty = repo[0].search.categoryTitle;
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
  }
  //check that repos exists, only one repo
  //TODO: make sure branch is active
  //if any of this is not true add operations with deletestaledocuments and deletestaleproperties
  return [searchProperty, url];
};

export default getProperties;
