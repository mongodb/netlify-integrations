import { Collection, Db } from "mongodb";
import {
  closeSnootyDb,
  db,
  getCollection,
  getSnootyDb,
  teardown,
} from "./searchConnector";
import {
  BranchEntry,
  DatabaseDocument,
  DocsetsDocument,
  ReposBranchesDocument,
} from "../types";
import { assertTrailingSlash } from "../utils";
import { deleteStaleProperties } from "./deleteStale";

const ATLAS_CLUSTER0_URI = `mongodb+srv://${process.env.MONGO_ATLAS_USERNAME}:${process.env.MONGO_ATLAS_PASSWORD}@${process.env.MONGO_ATLAS_CLUSTER0_HOST}/?retryWrites=true&w=majority`;
const SNOOTY_DB_NAME = `${process.env.MONGO_ATLAS_POOL_DB_NAME}`;

export const getDocsetEntry = async (
  docsets: Collection<DatabaseDocument>,
  project: string
) => {
  const docsetsQuery = { project: { $eq: project } };
  const docset = await docsets.findOne<DocsetsDocument>(docsetsQuery);
  if (!docset) {
    throw new Error(`Error while getting docsets entry in Atlas`);
  }
  return docset;
};

export const getRepoEntry = async ({
  repoName,
  repos_branches,
}: {
  repoName: string;
  repos_branches: Collection<DatabaseDocument>;
}) => {
  const query = {
    repoName: repoName,
  };

  const repo = await repos_branches.findOne<ReposBranchesDocument>(query, {
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
      `Could not get repos_branches entry for repo ${repoName}, ${repo}, ${JSON.stringify(
        query
      )}`
    );
  }
  if (
    repo.internalOnly ||
    !repo.prodDeployable ||
    !repo.search?.categoryTitle
  ) {
    // deletestaleproperties here for ALL manifests beginning with this repo? or just for this project-version searchproperty
    await deleteStaleProperties(repo.project);
    throw new Error(
      `Search manifest should not be generated for repo ${repoName}. Removing all associated manifests`
    );
  }

  return repo;
};

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
  const REPO_NAME = process.env.REPO_NAME;

  //check that an environment variable for repo name was set
  if (!REPO_NAME) {
    throw new Error(
      "No repo name supplied as environment variable, manifest cannot be uploaded to Atlas Search.Documents collection "
    );
  }

  //connect to database and get repos_branches, docsets collections
  const dbSession = await getSnootyDb();
  const repos_branches = getCollection(dbSession, "repos_branches");
  const docsets = getCollection(dbSession, "docsets");

  const repo: ReposBranchesDocument = await getRepoEntry({
    repoName: REPO_NAME,
    repos_branches,
  });

  const { project } = repo;

  const docsetEntry = await getDocsetEntry(docsets, project);
  //TODO: change based on environment
  const url = assertTrailingSlash(
    docsetEntry.url?.dotcomprd + docsetEntry.prefix.dotcomprd
  );

  const { isStableBranch, gitBranchName, active, urlSlug } = getBranch(
    repo.branches,
    branchName
  );

  const includeInGlobalSearch = isStableBranch;
  const version = urlSlug || gitBranchName;
  const searchProperty = `${repo.search?.categoryName ?? project}-${version}`;

  if (!active) {
    await deleteStaleProperties(searchProperty);
    throw new Error(
      `Search manifest should not be generated for inactive version ${version} of repo ${REPO_NAME}. Removing all associated manifests`
    );
  }
  await closeSnootyDb();
  return {
    searchProperty,
    projectName: project,
    url,
    includeInGlobalSearch,
  };
};

export default getProperties;
