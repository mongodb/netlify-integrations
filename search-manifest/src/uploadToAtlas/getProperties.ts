import { type Collection, type Db, Document, WithId } from "mongodb";
import { db, teardown } from "./searchConnector";
import type {
  BranchEntry,
  DatabaseDocument,
  DocsetsDocument,
  ReposBranchesDocument,
} from "../types";
import { assertTrailingSlash } from "../utils";
import { deleteStaleProperties } from "./deleteStaleProperties";

// helper function to find the associated branch
export const getBranch = (branches: Array<BranchEntry>, branchName: string) => {
  for (const branchObj of branches) {
    if (branchObj.gitBranchName.toLowerCase() == branchName.toLowerCase()) {
      return { ...branchObj };
    }
  }
  throw new Error(`Branch ${branchName} not found in branches object`);
};

const getProperties = async (branchName: string) => {
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
  let repos_branches: Collection<DatabaseDocument>;
  let docsets: Collection<DatabaseDocument>;
  let url = "";
  let searchProperty = "";
  let includeInGlobalSearch = false;
  let repo: ReposBranchesDocument | null;
  let docsetRepo: DocsetsDocument | null;
  let version: string;

  try {
    //connect to database and get repos_branches, docsets collections
    dbSession = await db({ uri: ATLAS_CLUSTER0_URI, dbName: SNOOTY_DB_NAME });
    repos_branches = dbSession.collection<DatabaseDocument>("repos_branches");
    docsets = dbSession.collection<DatabaseDocument>("docsets");
  } catch (e) {
    throw new Error(`issue starting session for Snooty Pool Database ${e}`);
  }

  const query = {
    repoName: REPO_NAME,
  };

  try {
    repo = await repos_branches.findOne<ReposBranchesDocument>(query, {
      projection: {
        _id: 0,
        project: 1,
        search: 1,
        branches: 1,
        prodDeployable: 1,
        internalOnly: 1,
      },
    });
    if (!repo) {
      throw new Error(
        `Could not get repos_branches entry for repo ${REPO_NAME}, ${repo}, ${JSON.stringify(
          query
        )}`
      );
    }
  } catch (e) {
    console.error(`Error while getting repos_branches entry in Atlas: ${e}`);
    throw e;
  }

  const { project } = repo;

  try {
    const docsetsQuery = { project: { $eq: project } };
    docsetRepo = await docsets.findOne<DocsetsDocument>(docsetsQuery);
    if (docsetRepo) {
      //TODO: change based on environment
      url = assertTrailingSlash(
        docsetRepo.url?.dotcomprd + docsetRepo.prefix.dotcomprd
      );
    }
  } catch (e) {
    console.error(`Error while getting docsets entry in Atlas ${e}`);
    throw e;
  }

  try {
    const { isStableBranch, gitBranchName, active, urlSlug } = getBranch(
      repo.branches,
      branchName
    );
    includeInGlobalSearch = isStableBranch;
    version = urlSlug || gitBranchName;
    searchProperty = `${repo.search?.categoryName ?? project}-${version}`;

    if (
      repo.internalOnly ||
      !repo.prodDeployable ||
      !repo.search?.categoryTitle
    ) {
      // deletestaleproperties here for ALL manifests beginning with this repo? or just for this project-version searchproperty
      await deleteStaleProperties(project);
      throw new Error(
        `Search manifest should not be generated for repo ${REPO_NAME}. Removing all associated manifests`
      );
    }
    if (!active) {
      deleteStaleProperties(searchProperty);
      throw new Error(
        `Search manifest should not be generated for inactive version ${version} of repo ${REPO_NAME}. Removing all associated manifests`
      );
    }
  } catch (e) {
    console.error(`Error`, e);
    throw e;
  }
  return { searchProperty, projectName: project, url, includeInGlobalSearch };
};

export default getProperties;
